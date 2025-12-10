package com.jules.obd2diagnostic.obd

import com.jules.obd2diagnostic.data.PidRepository
import com.jules.obd2diagnostic.data.db.VinManufacturerDao
import com.jules.obd2diagnostic.data.model.PidFile
import com.jules.obd2diagnostic.util.ResponseParser

class EcuAutoDetection(
    private val obdManager: ObdManager,
    private val pidRepository: PidRepository,
    private val vinManufacturerDao: VinManufacturerDao
) {

    suspend fun detectEcu(): PidFile? {
        val pidFiles = pidRepository.loadPidFiles()

        // Primary detection method: autoDetectIds
        for (pidFile in pidFiles) {
            for (command in pidFile.autoDetectIds) {
                val response = obdManager.sendCommand(command)
                if (isValidResponse(response)) {
                    return pidFile
                }
            }
        }

        // Fallback 1: VIN matching
        val vinResponse = obdManager.sendCommand("0902")
        if (isValidResponse(vinResponse)) {
            val vin = ResponseParser.parseAscii(vinResponse, "49 02")
            val manufacturer = getManufacturerFromVin(vin)
            val pidFile = pidFiles.find { it.manufacturer.equals(manufacturer, ignoreCase = true) }
            if (pidFile != null) return pidFile
        }

        // Fallback 2: ECU name matching
        val ecuNameResponse = obdManager.sendCommand("090A")
        if (isValidResponse(ecuNameResponse)) {
            val ecuName = ResponseParser.parseAscii(ecuNameResponse, "49 0A")
            val pidFile = pidFiles.find { ecuName.contains(it.ecu, ignoreCase = true) }
            if (pidFile != null) return pidFile
        }

        // Fallback 3: Mode 22
        for (pidFile in pidFiles.filter { it.protocol == "UDS" || it.protocol == "KWP2000" }) {
            for (command in pidFile.pids.map { it.command }) {
                val response = obdManager.sendCommand(command)
                if (isValidResponse(response)) return pidFile
            }
        }

        return null // No matching ECU found
    }

    private fun isValidResponse(response: String): Boolean {
        return response.isNotBlank() && !response.contains("NO DATA", ignoreCase = true) && !response.contains("ERROR", ignoreCase = true)
    }

    private suspend fun getManufacturerFromVin(vin: String): String {
        if (vin.length < 3) return "Unknown"
        val wmi = vin.substring(0, 3).uppercase()
        val manufacturer = vinManufacturerDao.getManufacturer(wmi)
        return manufacturer?.manufacturer ?: "Unknown"
    }
}