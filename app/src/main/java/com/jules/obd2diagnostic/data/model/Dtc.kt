package com.jules.obd2diagnostic.data.model

data class Dtc(
    val code: String,
    val description: String,
    val severity: String,
    val status: String,
    val freezeFrame: Map<String, String>? = null
)