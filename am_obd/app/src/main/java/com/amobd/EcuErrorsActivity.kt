package com.amobd

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Bundle
import android.os.IBinder
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kotlinx.coroutines.launch

class EcuErrorsActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var errorListAdapter: ErrorListAdapter
    private var bluetoothService: BluetoothService? = null
    private var isServiceBound = false

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            val binder = service as BluetoothService.LocalBinder
            bluetoothService = binder.getService()
            isServiceBound = true
        }

        override fun onServiceDisconnected(arg0: ComponentName) {
            isServiceBound = false
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_ecu_errors)

        recyclerView = findViewById(R.id.errors_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this)
        errorListAdapter = ErrorListAdapter()
        recyclerView.adapter = errorListAdapter

        val readErrorsButton: Button = findViewById(R.id.read_errors_button)
        readErrorsButton.setOnClickListener {
            readEcuErrors()
        }

        val clearErrorsButton: Button = findViewById(R.id.clear_errors_button)
        clearErrorsButton.setOnClickListener {
            clearEcuErrors()
        }
    }

    override fun onStart() {
        super.onStart()
        Intent(this, BluetoothService::class.java).also { intent ->
            bindService(intent, connection, Context.BIND_AUTO_CREATE)
        }
    }

    override fun onStop() {
        super.onStop()
        if (isServiceBound) {
            unbindService(connection)
            isServiceBound = false
        }
    }

    private fun readEcuErrors() {
        lifecycleScope.launch {
            bluetoothService?.write("03\r")
            val response = bluetoothService?.read()
            // Parse the response and update the RecyclerView
            // This is a placeholder, the actual parsing logic will depend on the OBD-II response format
            val errors = parseEcuErrors(response)
            errorListAdapter.setErrors(errors)
        }
    }

    private fun clearEcuErrors() {
        lifecycleScope.launch {
            bluetoothService?.write("04\r")
            // Optionally, read the response to confirm that the errors have been cleared
            readEcuErrors()
        }
    }

    private fun parseEcuErrors(response: String?): List<String> {
        // Placeholder parsing logic
        return response?.split("\r")?.filter { it.isNotBlank() } ?: emptyList()
    }

    class ErrorListAdapter : RecyclerView.Adapter<ErrorListAdapter.ErrorViewHolder>() {

        private var errors: List<String> = emptyList()

        fun setErrors(errors: List<String>) {
            this.errors = errors
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ErrorViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(android.R.layout.simple_list_item_1, parent, false)
            return ErrorViewHolder(view)
        }

        override fun onBindViewHolder(holder: ErrorViewHolder, position: Int) {
            holder.errorText.text = errors[position]
        }

        override fun getItemCount(): Int = errors.size

        class ErrorViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            val errorText: TextView = itemView.findViewById(android.R.id.text1)
        }
    }
}
