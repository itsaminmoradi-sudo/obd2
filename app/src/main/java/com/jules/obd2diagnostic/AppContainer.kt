package com.jules.obd2diagnostic

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager as AndroidBluetoothManager
import android.content.Context
import com.jules.obd2diagnostic.bluetooth.BluetoothManager
import com.jules.obd2diagnostic.data.EcuInfoRepository
import com.jules.obd2diagnostic.data.LiveDataRepository
import com.jules.obd2diagnostic.data.PidRepository
import com.jules.obd2diagnostic.data.db.AppDatabase
import com.jules.obd2diagnostic.obd.DtcDecoder
import com.jules.obd2diagnostic.obd.DtcManager
import com.jules.obd2diagnostic.obd.EcuAutoDetection
import com.jules.obd2diagnostic.obd.ObdManager

class AppContainer(private val context: Context) {

    private val bluetoothAdapter: BluetoothAdapter? by lazy {
        val bluetoothManager = context.getSystemService(AndroidBluetoothManager::class.java)
        bluetoothManager.adapter
    }

    private val database by lazy { AppDatabase.getDatabase(context) }

    val bluetoothManager: BluetoothManager? by lazy {
        bluetoothAdapter?.let { BluetoothManager(it) }
    }

    val obdManager: ObdManager? by lazy {
        bluetoothManager?.let { ObdManager(it) }
    }

    val pidRepository: PidRepository by lazy {
        PidRepository(context)
    }

    val dtcDao by lazy { database.dtcDao() }
    val vinManufacturerDao by lazy { database.vinManufacturerDao() }

    val dtcDecoder by lazy { DtcDecoder(dtcDao) }

    val ecuInfoRepository: EcuInfoRepository? by lazy {
        obdManager?.let { EcuInfoRepository(it) }
    }

    val dtcManager: DtcManager? by lazy {
        obdManager?.let { DtcManager(it, context) }
    }

    val liveDataRepository: LiveDataRepository? by lazy {
        obdManager?.let { LiveDataRepository(it, pidRepository) }
    }

    val ecuAutoDetection: EcuAutoDetection? by lazy {
        obdManager?.let { EcuAutoDetection(it, pidRepository, vinManufacturerDao) }
    }
}