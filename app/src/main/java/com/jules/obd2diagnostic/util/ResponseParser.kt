package com.jules.obd2diagnostic.util

object ResponseParser {

    fun parseAscii(response: String, prefix: String): String {
        val cleanResponse = response.replace("\r", "\n")
        val lines = cleanResponse.lines().filter { it.contains(prefix) }

        if (lines.isEmpty()) return "N/A"

        // Handle multi-frame responses
        val data = if (lines.size > 1) {
            lines.joinToString("") { it.substringAfter(prefix) }
        } else {
            lines.first().substringAfter(prefix)
        }

        return data.replace(" ", "").chunked(2).joinToString("") {
            try {
                it.toInt(16).toChar().toString()
            } catch (e: NumberFormatException) {
                "" // Ignore non-ASCII characters
            }
        }.trim('\u0000')
    }

    fun parseHex(response: String, prefix: String): String {
        val cleanResponse = response.replace("\r", "\n")
        val line = cleanResponse.lines().find { it.contains(prefix) }
        return line?.substringAfter(prefix)?.replace(" ", "") ?: "N/A"
    }

    fun parseFuelType(response: String): String {
        val cleanResponse = response.replace(" ", "").replace("\r", "\n")
        val data = cleanResponse.lines().find { it.startsWith("4151") }?.substring(4)
        return when (data?.toIntOrNull(16)) {
            1 -> "Gasoline"
            2 -> "Methanol"
            3 -> "Ethanol"
            4 -> "Diesel"
            5 -> "LPG"
            6 -> "CNG"
            7 -> "Propane"
            8 -> "Electric"
            else -> "Unknown"
        }
    }
}