package com.jules.obd2diagnostic.data.model

data class LiveData(
    val pid: Pid,
    val value: Any,
    val timestamp: Long = System.currentTimeMillis()
)