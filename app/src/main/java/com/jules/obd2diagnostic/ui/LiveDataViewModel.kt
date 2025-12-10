package com.jules.obd2diagnostic.ui

import android.app.Application
import androidx.lifecycle.viewModelScope
import com.jules.obd2diagnostic.data.model.LiveData
import com.jules.obd2diagnostic.data.model.Pid
import com.jules.obd2diagnostic.data.model.PidFile
import com.jules.obd2diagnostic.util.Result
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class LiveDataViewModel(application: Application) : BaseViewModel(application) {

    private val _pidFile = MutableStateFlow<PidFile?>(null)
    val pidFile: StateFlow<PidFile?> = _pidFile

    private val _liveData = MutableStateFlow<Map<String, Result<LiveData>>>(emptyMap())
    val liveData: StateFlow<Map<String, Result<LiveData>>> = _liveData

    private var streamingJob: Job? = null
    private val selectedPids = mutableListOf<Pid>()

    fun loadPidFile(manufacturer: String) {
        _pidFile.value = pidRepository.getPidFile(manufacturer)
        _pidFile.value?.pids?.let {
            selectedPids.clear()
            selectedPids.addAll(it)
        }
    }

    fun startStreaming() {
        if (streamingJob?.isActive == true) return
        streamingJob = viewModelScope.launch {
            while (isActive) {
                val updatedData = mutableMapOf<String, Result<LiveData>>()
                for (pid in selectedPids) {
                    val result = liveDataRepository?.fetchLiveData(pid)
                    updatedData[pid.name] = result ?: Result.Error("Live Data Repository not initialized")
                }
                _liveData.value = updatedData
                delay(200) // Update interval
            }
        }
    }

    fun stopStreaming() {
        streamingJob?.cancel()
    }
}