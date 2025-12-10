package com.jules.obd2diagnostic.ui.ecu

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.jules.obd2diagnostic.data.model.EcuInfo
import com.jules.obd2diagnostic.ui.EcuInfoViewModel
import com.jules.obd2diagnostic.util.Result

@Composable
fun EcuInfoScreen(ecuInfoViewModel: EcuInfoViewModel = viewModel()) {
    val ecuInfoResult by ecuInfoViewModel.ecuInfo.observeAsState()

    Column(modifier = Modifier.padding(16.dp)) {
        Button(onClick = { ecuInfoViewModel.fetchEcuInfo() }) {
            Text("Fetch ECU Info")
        }

        when (val result = ecuInfoResult) {
            is Result.Loading -> CircularProgressIndicator()
            is Result.Error -> Text(text = result.message)
            is Result.Success -> EcuInfoDetails(ecuInfo = result.data)
            else -> {}
        }
    }
}

@Composable
fun EcuInfoDetails(ecuInfo: EcuInfo) {
    Column {
        Text("VIN: ${ecuInfo.vin}")
        Text("Calibration ID: ${ecuInfo.calibrationId}")
        Text("Hardware Version: ${ecuInfo.hardwareVersion}")
        Text("Part Number: ${ecuInfo.partNumber}")
        Text("Serial Number: ${ecuInfo.serialNumber}")
        Text("ECU Coding: ${ecuInfo.ecuCoding}")
        Text("Immobilizer Status: ${ecuInfo.immobilizerStatus}")
        Text("Fuel Type: ${ecuInfo.fuelType}")
        Text("Engine Type: ${ecuInfo.engineType}")
    }
}