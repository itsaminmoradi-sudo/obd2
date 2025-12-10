package com.jules.obd2diagnostic

import android.app.Application

class ObdApplication : Application() {
    val appContainer by lazy { AppContainer(this) }
}