package com.jules.obd2diagnostic.data

import com.jules.obd2diagnostic.data.model.LiveData
import com.jules.obd2diagnostic.data.model.Pid
import com.jules.obd2diagnostic.obd.ObdManager
import com.jules.obd2diagnostic.util.Result
import com.singularsys.jep.Jep
import java.io.IOException

class LiveDataRepository(
    private val obdManager: ObdManager,
    private val pidRepository: PidRepository
) {

    suspend fun fetchLiveData(pid: Pid): Result<LiveData> {
        return try {
            val response = obdManager.sendCommand(pid.command)
            if (response.isNotBlank() && !response.contains("NO DATA", ignoreCase = true)) {
                val value = parseResponse(response, pid)
                if (value != null) {
                    Result.Success(LiveData(pid, value))
                } else {
                    Result.Error("Failed to parse response for PID: ${pid.name}")
                }
            } else {
                Result.Error("No data for PID: ${pid.name}")
            }
        } catch (e: IOException) {
            Result.Error("Failed to fetch live data: ${e.message}")
        }
    }

    private fun parseResponse(response: String, pid: Pid): Any? {
        val cleanResponse = response.replace(">", "").trim()
        val responseBytes = cleanResponse.split(" ").mapNotNull { it.toIntOrNull(16) }

        val commandParts = pid.command.split(" ")
        val mode = commandParts[0]
        val pidCode = commandParts.drop(1).joinToString("")

        val expectedResponseHeader = when (mode) {
            "22" -> "62" + pidCode
            else -> "4" + mode.drop(1) + pidCode
        }

        val dataBytes = if (cleanResponse.replace(" ", "").startsWith(expectedResponseHeader)) {
            responseBytes.drop(commandParts.size)
        } else {
            responseBytes
        }

        if (dataBytes.isNotEmpty()) {
            return evaluateFormula(pid.formula, dataBytes)
        }
        return null
    }

    private fun evaluateFormula(formula: String, bytes: List<Int>): Any? {
        return try {
            val jep = Jep()
            bytes.forEachIndexed { index, byte ->
                jep.addVariable(getVariableName(index), byte.toDouble())
            }
            jep.parse(formula)
            jep.evaluate()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun getVariableName(index: Int): String {
        return ('A' + index).toString()
    }
}