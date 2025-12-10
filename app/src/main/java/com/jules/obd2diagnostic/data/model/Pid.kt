package com.jules.obd2diagnostic.data.model

data class Pid(
    val name: String,
    val command: String,
    val type: String,
    val formula: String,
    val unit: String
)