package com.jules.obd2diagnostic.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import com.jules.obd2diagnostic.ObdApplication

abstract class BaseViewModel(application: Application) : AndroidViewModel(application) {

    protected val appContainer = (application as ObdApplication).appContainer

    protected val bluetoothManager = appContainer.bluetoothManager
    protected val obdManager = appContainer.obdManager
    protected val pidRepository = appContainer.pidRepository
    protected val ecuInfoRepository = appContainer.ecuInfoRepository
    protected val dtcManager = appContainer.dtcManager
    protected val liveDataRepository = appContainer.liveDataRepository
}