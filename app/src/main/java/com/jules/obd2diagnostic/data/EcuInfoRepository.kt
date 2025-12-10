package com.jules.obd2diagnostic.data

import com.jules.obd2diagnostic.data.model.EcuInfo
import com.jules.obd2diagnostic.obd.ObdManager
import com.jules.obd2diagnostic.util.ResponseParser
import com.jules.obd2diagnostic.util.Result
import java.io.IOException

class EcuInfoRepository(private val obdManager: ObdManager) {

    suspend fun fetchEcuInfo(): Result<EcuInfo> {
        return try {
            val vin = getVin()
            val calibrationId = getCalibrationId()
            val fuelType = getFuelType()
            val hardwareVersion = getUdsData("22F189")
            val partNumber = getUdsData("22F18C")
            val serialNumber = getUdsData("22F194")
            val ecuCoding = getUdsData("22F195")
            val immobilizerStatus = getUdsData("22F19D")
            val softwareVersion = getUdsData("22F192")
            val engineType = getEngineType()
            val supportedPids = getSupportedPids("01")
            val supportedServices = getSupportedServices()

            Result.Success(
                EcuInfo(
                    vin = vin,
                    calibrationId = calibrationId,
                    fuelType = fuelType,
                    hardwareVersion = hardwareVersion,
                    partNumber = partNumber,
                    serialNumber = serialNumber,
                    ecuCoding = ecuCoding,
                    immobilizerStatus = immobilizerStatus,
                    softwareVersion = softwareVersion,
                    engineType = engineType,
                    supportedPids = supportedPids,
                    supportedServices = supportedServices
                )
            )
        } catch (e: IOException) {
            Result.Error("Failed to fetch ECU info: ${e.message}")
        }
    }

    private suspend fun getVin(): String {
        val response = obdManager.sendCommand("0902")
        return if (response.isNotBlank() && !response.contains("NO DATA", ignoreCase = true)) {
            ResponseParser.parseAscii(response, "49 02")
        } else "N/A"
    }

    private suspend fun getCalibrationId(): String {
        val response = obdManager.sendCommand("0904")
        return if (response.isNotBlank() && !response.contains("NO DATA", ignoreCase = true)) {
            ResponseParser.parseHex(response, "49 04")
        } else "N/A"
    }

    private suspend fun getFuelType(): String {
        val response = obdManager.sendCommand("0151")
        return if (response.isNotBlank() && !response.contains("NO DATA", ignoreCase = true)) {
            ResponseParser.parseFuelType(response)
        } else "N/A"
    }

    private suspend fun getEngineType(): String {
        // This is a manufacturer-specific command, this is an example for some ECUs
        val response = obdManager.sendCommand("221102")
        return if (response.isNotBlank() && !response.contains("NO DATA", ignoreCase = true)) {
            ResponseParser.parseAscii(response, "621102")
        } else "N/A"
    }

    private suspend fun getUdsData(command: String): String {
        val response = obdManager.sendCommand(command)
        return if (response.isNotBlank() && !response.contains("NO DATA", ignoreCase = true)) {
            ResponseParser.parseAscii(response, "62") // UDS positive response
        } else "N/A"
    }

    private suspend fun getSupportedPids(mode: String): List<String> {
        val pids = mutableListOf<String>()
        for (i in 0..6) {
            val command = mode + String.format("%02X", i * 0x20)
            val response = obdManager.sendCommand(command)
            if (response.isNotBlank() && !response.contains("NO DATA", ignoreCase = true)) {
                val data = ResponseParser.parseHex(response, "4" + mode.drop(1))
                val binary = data.toLong(16).toString(2).padStart(32, '0')
                for (j in binary.indices) {
                    if (binary[j] == '1') {
                        pids.add(String.format("%02X", i * 0x20 + j + 1))
                    }
                }
            }
        }
        return pids
    }

    private suspend fun getSupportedServices(): List<String> {
        // UDS command to read supported services
        val response = obdManager.sendCommand("22F183")
        return if (response.isNotBlank() && !response.contains("NO DATA", ignoreCase = true)) {
            ResponseParser.parseHex(response, "62F183").chunked(2)
        } else emptyList()
    }
}