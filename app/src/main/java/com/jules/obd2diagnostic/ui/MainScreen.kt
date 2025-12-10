package com.jules.obd2diagnostic.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.jules.obd2diagnostic.R
import com.jules.obd2diagnostic.ui.diagnostics.DiagnosticsScreen
import com.jules.obd2diagnostic.ui.ecu.EcuInfoScreen
import com.jules.obd2diagnostic.ui.home.HomeScreen
import com.jules.obd2diagnostic.ui.livedata.LiveDataScreen
import com.jules.obd2diagnostic.ui.navigation.Screen

@Composable
fun MainScreen() {
    val navController = rememberNavController()
    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                val items = listOf(
                    Screen.Home,
                    Screen.Diagnostics,
                    Screen.LiveData,
                    Screen.EcuInfo
                )
                items.forEach { screen ->
                    NavigationBarItem(
                        icon = { Icon(painterResource(id = screen.icon), contentDescription = null) },
                        label = { Text(screen.route) },
                        selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(navController, startDestination = Screen.Home.route, Modifier.padding(innerPadding)) {
            composable(Screen.Home.route) { HomeScreen(navController) }
            composable(Screen.Diagnostics.route) { DiagnosticsScreen() }
            composable(Screen.LiveData.route + "/{manufacturer}") { backStackEntry ->
                val manufacturer = backStackEntry.arguments?.getString("manufacturer")
                if (manufacturer != null) {
                    LiveDataScreen(manufacturer = manufacturer)
                }
            }
            composable(Screen.EcuInfo.route) { EcuInfoScreen() }
        }
    }
}