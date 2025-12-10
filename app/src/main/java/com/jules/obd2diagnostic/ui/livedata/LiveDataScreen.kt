package com.jules.obd2diagnostic.ui.livedata

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.github.mikephil.charting.data.Entry
import com.jules.obd2diagnostic.data.model.LiveData
import com.jules.obd2diagnostic.data.model.Pid
import com.jules.obd2diagnostic.ui.LiveDataViewModel
import com.jules.obd2diagnostic.util.Result

@Composable
fun LiveDataScreen(
    manufacturer: String,
    liveDataViewModel: LiveDataViewModel = viewModel()
) {
    LaunchedEffect(manufacturer) {
        liveDataViewModel.loadPidFile(manufacturer)
    }

    val pidFile by liveDataViewModel.pidFile.collectAsState()
    val liveDataMap by liveDataViewModel.liveData.collectAsState()
    val chartEntries = remember { mutableStateListOf<Entry>() }
    var selectedPid by remember { mutableStateOf<Pid?>(null) }

    LaunchedEffect(liveDataMap, selectedPid) {
        selectedPid?.let { pid ->
            liveDataMap[pid.name]?.let { result ->
                if (result is Result.Success) {
                    val value = (result.data.value as? Number)?.toFloat()
                    if (value != null) {
                        chartEntries.add(Entry(result.data.timestamp.toFloat(), value))
                        if (chartEntries.size > 100) {
                            chartEntries.removeAt(0)
                        }
                    }
                }
            }
        }
    }

    Column(modifier = Modifier.padding(16.dp)) {
        Row {
            Button(onClick = {
                chartEntries.clear()
                liveDataViewModel.startStreaming()
            }) {
                Text("Start")
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(onClick = { liveDataViewModel.stopStreaming() }) {
                Text("Stop")
            }
        }

        pidFile?.let {
            PidDropdown(
                pids = it.pids,
                selectedPid = selectedPid,
                onPidSelected = {
                    selectedPid = it
                    chartEntries.clear()
                }
            )
        }

        if (chartEntries.isNotEmpty()) {
            LiveDataChart(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp),
                data = chartEntries.toList()
            )
        }

        LiveDataList(liveData = liveDataMap.values.toList())
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PidDropdown(
    pids: List<Pid>,
    selectedPid: Pid?,
    onPidSelected: (Pid) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded }
    ) {
        TextField(
            value = selectedPid?.name ?: "Select a PID to chart",
            onValueChange = {},
            readOnly = true,
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.menuAnchor()
        )

        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            pids.forEach { pid ->
                DropdownMenuItem(
                    text = { Text(pid.name) },
                    onClick = {
                        onPidSelected(pid)
                        expanded = false
                    }
                )
            }
        }
    }
}

@Composable
fun LiveDataList(liveData: List<Result<LiveData>>) {
    LazyColumn {
        items(liveData) { result ->
            when (result) {
                is Result.Success -> LiveDataListItem(data = result.data)
                is Result.Error -> Text(text = result.message)
                is Result.Loading -> CircularProgressIndicator()
            }
        }
    }
}

@Composable
fun LiveDataListItem(data: LiveData) {
    Column(modifier = Modifier.padding(8.dp)) {
        Text(text = data.pid.name)
        Text(text = "${data.value} ${data.pid.unit}")
    }
}