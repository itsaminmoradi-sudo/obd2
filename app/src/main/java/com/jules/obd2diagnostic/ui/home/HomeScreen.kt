package com.jules.obd2diagnostic.ui.home

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.jules.obd2diagnostic.ui.BluetoothViewModel
import com.jules.obd2diagnostic.ui.EcuViewModel
import com.jules.obd2diagnostic.ui.navigation.Screen
import com.jules.obd2diagnostic.util.Result

@SuppressLint("MissingPermission")
@Composable
fun HomeScreen(
    navController: NavController,
    bluetoothViewModel: BluetoothViewModel = viewModel(),
    ecuViewModel: EcuViewModel = viewModel()
) {
    val pairedDevices by bluetoothViewModel.pairedDevices.observeAsState(initial = emptyList())
    val connectionStatus by bluetoothViewModel.connectionStatus.observeAsState()
    val detectedEcu by ecuViewModel.detectedEcu.observeAsState()

    Column(modifier = Modifier.padding(16.dp)) {
        Button(onClick = { bluetoothViewModel.getPairedDevices() }) {
            Text("Scan for Paired Devices")
        }

        when (val status = connectionStatus) {
            is Result.Loading -> CircularProgressIndicator()
            is Result.Error -> Text(text = status.message)
            is Result.Success -> {
                Text(text = "Connected")
                Button(onClick = { ecuViewModel.startEcuDetection() }) {
                    Text("Detect ECU")
                }
            }
            else -> Text(text = "Not Connected")
        }

        LaunchedEffect(detectedEcu) {
            detectedEcu?.let {
                navController.navigate(Screen.LiveData.route + "/${it.manufacturer}")
            }
        }

        LazyColumn {
            items(pairedDevices) { device ->
                DeviceListItem(device = device) {
                    bluetoothViewModel.connectToDevice(device)
                }
            }
        }
    }
}

@SuppressLint("MissingPermission")
@Composable
fun DeviceListItem(device: BluetoothDevice, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(8.dp)
    ) {
        Text(text = device.name)
        Text(text = device.address)
    }
}