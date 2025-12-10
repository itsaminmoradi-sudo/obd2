package com.jules.obd2diagnostic.ui

import android.app.Application
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.jules.obd2diagnostic.data.model.Dtc
import com.jules.obd2diagnostic.util.Result
import kotlinx.coroutines.launch

class DtcViewModel(application: Application) : BaseViewModel(application) {

    val storedDtcs = MutableLiveData<Result<List<Dtc>>>()
    val pendingDtcs = MutableLiveData<Result<List<Dtc>>>()
    val permanentDtcs = MutableLiveData<Result<List<Dtc>>>()
    val clearStatus = MutableLiveData<Result<Unit>>()

    fun readStoredDtcs() {
        viewModelScope.launch {
            storedDtcs.postValue(Result.Loading)
            val result = dtcManager?.readStoredDtcs()
            storedDtcs.postValue(result ?: Result.Error("DTC Manager not initialized"))
        }
    }

    fun readPendingDtcs() {
        viewModelScope.launch {
            pendingDtcs.postValue(Result.Loading)
            val result = dtcManager?.readPendingDtcs()
            pendingDtcs.postValue(result ?: Result.Error("DTC Manager not initialized"))
        }
    }

    fun readPermanentDtcs() {
        viewModelScope.launch {
            permanentDtcs.postValue(Result.Loading)
            val result = dtcManager?.readPermanentDtcs()
            permanentDtcs.postValue(result ?: Result.Error("DTC Manager not initialized"))
        }
    }

    fun clearDtcs() {
        viewModelScope.launch {
            clearStatus.postValue(Result.Loading)
            val result = dtcManager?.clearDtcs()
            clearStatus.postValue(result ?: Result.Error("DTC Manager not initialized"))
        }
    }
}