package com.jules.obd2diagnostic.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.IOException

@Database(entities = [DtcEntity::class, VinManufacturerEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun dtcDao(): DtcDao
    abstract fun vinManufacturerDao(): VinManufacturerDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "obd2_database"
                )
                    .addCallback(DatabaseCallback(context))
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }

    private class DatabaseCallback(private val context: Context) : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                CoroutineScope(Dispatchers.IO).launch {
                    prepopulateDatabase(context, database.dtcDao(), database.vinManufacturerDao())
                }
            }
        }
    }
}

suspend fun prepopulateDatabase(context: Context, dtcDao: DtcDao, vinManufacturerDao: VinManufacturerDao) {
    // Prepopulate DTCs
    try {
        val dtcJson = context.assets.open("dtc.json").bufferedReader().use { it.readText() }
        val dtcListType = object : TypeToken<List<DtcEntity>>() {}.type
        val dtcs: List<DtcEntity> = Gson().fromJson(dtcJson, dtcListType)
        dtcDao.insertAll(dtcs)
    } catch (e: IOException) {
        e.printStackTrace()
    }

    // Prepopulate VIN manufacturers
    try {
        val vinJson = context.assets.open("vin-manufacturer.json").bufferedReader().use { it.readText() }
        val vinListType = object : TypeToken<List<VinManufacturerEntity>>() {}.type
        val manufacturers: List<VinManufacturerEntity> = Gson().fromJson(vinJson, vinListType)
        vinManufacturerDao.insertAll(manufacturers)
    } catch (e: IOException) {
        e.printStackTrace()
    }
}