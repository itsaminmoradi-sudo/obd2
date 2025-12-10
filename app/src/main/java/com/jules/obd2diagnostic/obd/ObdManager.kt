package com.jules.obd2diagnostic.obd

import com.jules.obd2diagnostic.bluetooth.BluetoothManager

class ObdManager(private val bluetoothManager: BluetoothManager) {

    enum class Protocol {
        AUTO, KWP2000_FAST, KWP2000_5BPS, UDS_11_500, UDS_29_500
    }

    private var currentProtocol = Protocol.AUTO

    suspend fun initializeElm(protocol: Protocol = Protocol.AUTO): Boolean {
        currentProtocol = protocol

        if (!sendAndCheck("ATZ", "ELM327")) return false
        if (!sendAndCheck("ATE0", "OK")) return false
        if (!sendAndCheck("ATL0", "OK")) return false

        val protocolCommand = when (protocol) {
            Protocol.KWP2000_FAST -> "ATSP5"
            Protocol.KWP2000_5BPS -> "ATSP4"
            Protocol.UDS_11_500 -> "ATSP6"
            Protocol.UDS_29_500 -> "ATSP7"
            else -> "ATSP0"
        }
        if (!sendAndCheck(protocolCommand, "OK")) return false

        if (protocol == Protocol.KWP2000_5BPS) {
            // 5-baud init
            return sendAndCheck("ATSI", "OK")
        }

        if (protocol == Protocol.KWP2000_FAST) {
            // Fast init
            return sendAndCheck("ATFI", "OK")
        }

        return true
    }

    suspend fun sendCommand(command: String, ecuAddress: String? = null): String {
        return when (currentProtocol) {
            Protocol.KWP2000_FAST, Protocol.KWP2000_5BPS -> sendKwp2000Command(command)
            Protocol.UDS_11_500, Protocol.UDS_29_500 -> sendUdsCommand(command, ecuAddress)
            else -> sendObdCommand(command)
        }
    }

    private suspend fun sendObdCommand(command: String): String {
        return bluetoothManager.sendCommand(command)
    }

    private suspend fun sendKwp2000Command(command: String): String {
        return bluetoothManager.sendCommand(command.replace(" ", ""))
    }

    private suspend fun sendUdsCommand(command: String, ecuAddress: String?): String {
        ecuAddress?.let {
            if (!sendAndCheck("ATSH $it", "OK")) return "Error setting header"
        }
        return bluetoothManager.sendCommand(command)
    }

    private suspend fun sendAndCheck(command: String, expectedResponse: String): Boolean {
        val response = bluetoothManager.sendCommand(command)
        return response.contains(expectedResponse, ignoreCase = true)
    }
}