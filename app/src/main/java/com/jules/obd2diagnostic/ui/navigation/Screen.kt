package com.jules.obd2diagnostic.ui.navigation

import androidx.annotation.DrawableRes
import com.jules.obd2diagnostic.R

sealed class Screen(val route: String, @DrawableRes val icon: Int) {
    object Home : Screen("Home", R.drawable.ic_home)
    object Diagnostics : Screen("Diagnostics", R.drawable.ic_diagnostic)
    object LiveData : Screen("Live Data", R.drawable.ic_live_data)
    object EcuInfo : Screen("ECU Info", R.drawable.ic_ecu_info)
}