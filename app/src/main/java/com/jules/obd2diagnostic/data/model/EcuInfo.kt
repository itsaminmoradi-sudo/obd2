package com.jules.obd2diagnostic.data.model

data class EcuInfo(
    val vin: String = "N/A",
    val calibrationId: String = "N/A",
    val hardwareVersion: String = "N/A",
    val partNumber: String = "N/A",
    val serialNumber: String = "N/A",
    val ecuCoding: String = "N/A",
    val immobilizerStatus: String = "N/A",
    val fuelType: String = "N/A",
    val engineType: String = "N/A",
    val supportedServices: List<String> = emptyList(),
    val supportedPids: List<String> = emptyList()
)