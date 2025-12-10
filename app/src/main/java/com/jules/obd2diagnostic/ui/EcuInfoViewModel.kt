package com.jules.obd2diagnostic.ui

import android.app.Application
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.jules.obd2diagnostic.data.model.EcuInfo
import com.jules.obd2diagnostic.util.Result
import kotlinx.coroutines.launch

class EcuInfoViewModel(application: Application) : BaseViewModel(application) {

    val ecuInfo = MutableLiveData<Result<EcuInfo>>()

    fun fetchEcuInfo() {
        viewModelScope.launch {
            ecuInfo.postValue(Result.Loading)
            val result = ecuInfoRepository?.fetchEcuInfo()
            ecuInfo.postValue(result ?: Result.Error("ECU Info Repository not initialized"))
        }
    }
}