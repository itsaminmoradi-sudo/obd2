package com.jules.obd2diagnostic.obd

import com.jules.obd2diagnostic.data.db.DtcDao
import com.jules.obd2diagnostic.data.model.Dtc

class DtcDecoder(private val dtcDao: DtcDao) {

    suspend fun decodeDtc(hexCode: String): Dtc {
        val firstChar = when (hexCode[0]) {
            '0', '1', '2', '3' -> 'P'
            '4', '5', '6', '7' -> 'C'
            '8', '9', 'A', 'B' -> 'B'
            'C', 'D', 'E', 'F' -> 'U'
            else -> 'P'
        }

        val code = firstChar + hexCode.substring(1)
        val dtcEntity = dtcDao.getDtc(code)
        val description = dtcEntity?.description ?: "Unknown DTC"
        val severity = getSeverity(firstChar)

        return Dtc(code, description, severity, "Unknown Status")
    }

    private fun getSeverity(type: Char): String {
        return when (type) {
            'P' -> "Powertrain"
            'C' -> "Chassis"
            'B' -> "Body"
            'U' -> "Network"
            else -> "Unknown"
        }
    }

    fun getStatusDescription(status: String): String {
        val statusByte = status.toInt(16)
        val descriptions = mutableListOf<String>()
        if (statusByte and 0x01 != 0) descriptions.add("Test Failed")
        if (statusByte and 0x02 != 0) descriptions.add("Test Failed This Operation Cycle")
        if (statusByte and 0x04 != 0) descriptions.add("Pending DTC")
        if (statusByte and 0x08 != 0) descriptions.add("Confirmed DTC")
        if (statusByte and 0x10 != 0) descriptions.add("Test Not Completed Since Last Clear")
        if (statusByte and 0x20 != 0) descriptions.add("Test Failed Since Last Clear")
        if (statusByte and 0x40 != 0) descriptions.add("Test Not Completed This Operation Cycle")
        if (statusByte and 0x80 != 0) descriptions.add("Warning Indicator Requested")
        return descriptions.joinToString(", ")
    }
}