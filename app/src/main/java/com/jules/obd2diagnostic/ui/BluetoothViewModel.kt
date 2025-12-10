package com.jules.obd2diagnostic.ui

import android.annotation.SuppressLint
import android.app.Application
import android.bluetooth.BluetoothDevice
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.jules.obd2diagnostic.util.Result
import kotlinx.coroutines.launch
import java.io.IOException

@SuppressLint("MissingPermission")
class BluetoothViewModel(application: Application) : BaseViewModel(application) {

    private val _pairedDevices = MutableLiveData<List<BluetoothDevice>>()
    val pairedDevices: LiveData<List<BluetoothDevice>> = _pairedDevices

    private val _connectionStatus = MutableLiveData<Result<Unit>>()
    val connectionStatus: LiveData<Result<Unit>> = _connectionStatus

    fun getPairedDevices() {
        bluetoothManager?.let {
            _pairedDevices.value = it.getPairedDevices()
        }
    }

    fun connectToDevice(device: BluetoothDevice) {
        viewModelScope.launch {
            _connectionStatus.value = Result.Loading
            try {
                bluetoothManager?.connect(device)
                _connectionStatus.value = Result.Success(Unit)
            } catch (e: IOException) {
                _connectionStatus.value = Result.Error("Failed to connect: ${e.message}")
            }
        }
    }

    fun disconnect() {
        bluetoothManager?.disconnect()
    }
}