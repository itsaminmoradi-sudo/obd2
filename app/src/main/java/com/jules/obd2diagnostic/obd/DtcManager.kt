package com.jules.obd2diagnostic.obd

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.jules.obd2diagnostic.data.model.Dtc
import com.jules.obd2diagnostic.util.Result
import java.io.IOException

class DtcManager(
    private val obdManager: ObdManager,
    private val context: Context,
    private val dtcDecoder: DtcDecoder
) {

    private val pidDescriptions by lazy { loadPidDescriptions() }

    suspend fun readStoredDtcs(): Result<List<Dtc>> = readStandardDtcs("03", "43")
    suspend fun readPendingDtcs(): Result<List<Dtc>> = readStandardDtcs("07", "47")
    suspend fun readPermanentDtcs(): Result<List<Dtc>> = readStandardDtcs("0A", "4A")

    suspend fun clearDtcs(): Result<Unit> = sendCommandAndCheck("04", "44", "Failed to clear DTCs")
    suspend fun clearUdsDtcs(): Result<Unit> = sendCommandAndCheck("14FFFFFF", "54", "Failed to clear UDS DTCs")
    suspend fun clearKwp2000Dtcs(): Result<Unit> = sendCommandAndCheck("14", "54", "Failed to clear KWP2000 DTCs")

    suspend fun readUdsDtcs(): Result<List<Dtc>> = readAndParse("19 02 FF", ::parseUdsDtcResponse, "Failed to read UDS DTCs")
    suspend fun readKwp2000Dtcs(): Result<List<Dtc>> = readAndParse("18000000", ::parseKwp2000DtcResponse, "Failed to read KWP2000 DTCs")

    private suspend fun readStandardDtcs(command: String, prefix: String): Result<List<Dtc>> =
        readAndParse(command, { response -> parseDtcResponse(response, prefix) }, "Failed to read DTCs")

    private suspend fun sendCommandAndCheck(command: String, expected: String, errorMessage: String): Result<Unit> {
        return try {
            val response = obdManager.sendCommand(command)
            if (response.contains(expected)) Result.Success(Unit)
            else Result.Error(errorMessage)
        } catch (e: IOException) {
            Result.Error("$errorMessage: ${e.message}")
        }
    }

    private suspend fun readAndParse(command: String, parser: suspend (String) -> List<Dtc>, errorMessage: String): Result<List<Dtc>> {
        return try {
            val response = obdManager.sendCommand(command)
            Result.Success(parser(response))
        } catch (e: IOException) {
            Result.Error("$errorMessage: ${e.message}")
        }
    }

    private suspend fun parseDtcResponse(response: String, prefix: String): List<Dtc> {
        val dtcs = mutableListOf<Dtc>()
        response.lines().forEach { line ->
            if (line.startsWith(prefix)) {
                line.substring(prefix.length).chunked(4).forEach { hexCode ->
                    if (hexCode != "0000") {
                        val freezeFrame = getFreezeFrame(hexCode)
                        val decodedDtc = dtcDecoder.decodeDtc(hexCode)
                        dtcs.add(decodedDtc.copy(freezeFrame = freezeFrame))
                    }
                }
            }
        }
        return dtcs
    }

    private suspend fun parseUdsDtcResponse(response: String): List<Dtc> {
        val dtcs = mutableListOf<Dtc>()
        if (response.startsWith("59 02")) {
            response.substring(6).split(" ").chunked(4).forEach {
                val hexCode = it[0] + it[1]
                val status = it[2]
                val freezeFrame = getFreezeFrame(hexCode)
                val decodedDtc = dtcDecoder.decodeDtc(hexCode)
                dtcs.add(decodedDtc.copy(status = status, freezeFrame = freezeFrame))
            }
        }
        return dtcs
    }

    private suspend fun parseKwp2000DtcResponse(response: String): List<Dtc> {
        val dtcs = mutableListOf<Dtc>()
        if(response.startsWith("58")) {
            response.substring(2).chunked(6).forEach {
                val hexCode = it.substring(0, 4)
                val status = it.substring(4, 6)
                val freezeFrame = getFreezeFrame(hexCode)
                val decodedDtc = dtcDecoder.decodeDtc(hexCode)
                dtcs.add(decodedDtc.copy(status = status, freezeFrame = freezeFrame))
            }
        }
        return dtcs
    }

    private suspend fun getFreezeFrame(dtc: String): Map<String, String> {
        val freezeFrame = mutableMapOf<String, String>()
        val response = obdManager.sendCommand("0202$dtc")
        if (response.isNotBlank() && !response.contains("NO DATA", ignoreCase = true)) {
            response.lines().forEach { line ->
                if (line.startsWith("42 02")) {
                    val frames = line.substring(6).split(" ")
                    for (i in frames.indices step 2) {
                        val pid = frames[i]
                        val value = frames.getOrNull(i + 1) ?: ""
                        val description = pidDescriptions[pid] ?: "Unknown PID"
                        freezeFrame[description] = value
                    }
                }
            }
        }
        return freezeFrame
    }

    private fun loadPidDescriptions(): Map<String, String> {
        return try {
            val json = context.assets.open("pid-descriptions.json").bufferedReader().use { it.readText() }
            val type = object : TypeToken<Map<String, String>>() {}.type
            Gson().fromJson(json, type)
        } catch (e: IOException) {
            emptyMap()
        }
    }
}