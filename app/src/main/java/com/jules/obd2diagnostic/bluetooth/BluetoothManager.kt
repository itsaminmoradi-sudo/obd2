package com.jules.obd2diagnostic.bluetooth

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.io.OutputStream
import java.util.*

class BluetoothManager(private val bluetoothAdapter: BluetoothAdapter) {

    private var bluetoothSocket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private var reader: BufferedReader? = null

    @SuppressLint("MissingPermission")
    fun getPairedDevices(): List<BluetoothDevice> {
        return bluetoothAdapter.bondedDevices.toList()
    }

    @SuppressLint("MissingPermission")
    suspend fun connect(device: BluetoothDevice) {
        withContext(Dispatchers.IO) {
            val uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB") // Standard SPP UUID
            bluetoothSocket = device.createRfcommSocketToServiceRecord(uuid)
            bluetoothSocket?.connect()
            outputStream = bluetoothSocket?.outputStream
            reader = BufferedReader(InputStreamReader(bluetoothSocket?.inputStream))
        }
    }

    fun disconnect() {
        try {
            outputStream?.close()
            reader?.close()
            bluetoothSocket?.close()
        } catch (e: IOException) {
            e.printStackTrace()
        }
    }

    suspend fun sendCommand(command: String): String {
        return withContext(Dispatchers.IO) {
            outputStream?.write((command + "\r").toByteArray())
            outputStream?.flush()

            val response = StringBuilder()
            var line: String?
            while (reader?.readLine().also { line = it } != null) {
                if (line?.endsWith('>') == true) {
                    response.append(line?.dropLast(1))
                    break
                }
                response.append(line)
            }
            response.toString().trim()
        }
    }
}