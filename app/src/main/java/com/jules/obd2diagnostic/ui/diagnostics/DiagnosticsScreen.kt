package com.jules.obd2diagnostic.ui.diagnostics

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.jules.obd2diagnostic.data.model.Dtc
import com.jules.obd2diagnostic.ui.DtcViewModel
import com.jules.obd2diagnostic.util.Result

@Composable
fun DiagnosticsScreen(dtcViewModel: DtcViewModel = viewModel()) {
    val storedDtcs by dtcViewModel.storedDtcs.observeAsState()
    val pendingDtcs by dtcViewModel.pendingDtcs.observeAsState()
    val permanentDtcs by dtcViewModel.permanentDtcs.observeAsState()
    val clearStatus by dtcViewModel.clearStatus.observeAsState()

    Column(modifier = Modifier.padding(16.dp)) {
        Button(onClick = {
            dtcViewModel.readStoredDtcs()
            dtcViewModel.readPendingDtcs()
            dtcViewModel.readPermanentDtcs()
        }) {
            Text("Read All DTCs")
        }

        Button(onClick = { dtcViewModel.clearDtcs() }) {
            Text("Clear DTCs")
        }

        when (val status = clearStatus) {
            is Result.Loading -> CircularProgressIndicator()
            is Result.Error -> Text(text = status.message)
            is Result.Success -> Text("DTCs Cleared Successfully")
            else -> {}
        }

        DtcResultList("Stored DTCs", storedDtcs)
        DtcResultList("Pending DTCs", pendingDtcs)
        DtcResultList("Permanent DTCs", permanentDtcs)
    }
}

@Composable
fun DtcResultList(title: String, result: Result<List<Dtc>>?) {
    Column {
        Text(text = title)
        when (result) {
            is Result.Loading -> CircularProgressIndicator()
            is Result.Error -> Text(text = result.message)
            is Result.Success -> DtcList(result.data)
            else -> {}
        }
    }
}

@Composable
fun DtcList(dtcs: List<Dtc>) {
    LazyColumn {
        items(dtcs) { dtc ->
            DtcListItem(dtc = dtc)
        }
    }
}

@Composable
fun DtcListItem(dtc: Dtc) {
    Column(modifier = Modifier.padding(8.dp)) {
        Text(text = dtc.code)
        Text(text = dtc.description)
    }
}