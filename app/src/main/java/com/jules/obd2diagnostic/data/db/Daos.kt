package com.jules.obd2diagnostic.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface DtcDao {
    @Query("SELECT * FROM dtc WHERE code = :code")
    suspend fun getDtc(code: String): DtcEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(dtcs: List<DtcEntity>)
}

@Dao
interface VinManufacturerDao {
    @Query("SELECT * FROM vin_manufacturer WHERE wmi = :wmi")
    suspend fun getManufacturer(wmi: String): VinManufacturerEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(manufacturers: List<VinManufacturerEntity>)
}