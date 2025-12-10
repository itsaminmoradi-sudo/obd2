package com.jules.obd2diagnostic.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "dtc")
data class DtcEntity(
    @PrimaryKey val code: String,
    val description: String
)

@Entity(tableName = "vin_manufacturer")
data class VinManufacturerEntity(
    @PrimaryKey val wmi: String,
    val manufacturer: String
)