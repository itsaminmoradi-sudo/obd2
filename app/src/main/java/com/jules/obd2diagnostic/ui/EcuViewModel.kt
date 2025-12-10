package com.jules.obd2diagnostic.ui

import android.app.Application
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.jules.obd2diagnostic.data.model.PidFile
import kotlinx.coroutines.launch

class EcuViewModel(application: Application) : BaseViewModel(application) {

    private val ecuAutoDetection = appContainer.ecuAutoDetection

    val detectedEcu = MutableLiveData<PidFile?>()

    fun startEcuDetection() {
        viewModelScope.launch {
            val pidFile = ecuAutoDetection?.detectEcu()
            detectedEcu.postValue(pidFile)
        }
    }
}