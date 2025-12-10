package com.jules.obd2diagnostic.data.model

data class PidFile(
    val manufacturer: String,
    val protocol: String,
    val ecu: String,
    val autoDetectIds: List<String>,
    val pids: List<Pid>
)