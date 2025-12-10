package com.jules.obd2diagnostic.data

import android.content.Context
import com.google.gson.Gson
import com.jules.obd2diagnostic.data.model.PidFile
import java.io.File
import java.io.IOException

class PidRepository(private val context: Context) {

    private val gson = Gson()
    private val internalPidsDir by lazy { File(context.filesDir, "pids") }
    private var cachedPidFiles: List<PidFile>? = null

    init {
        if (!internalPidsDir.exists()) {
            internalPidsDir.mkdir()
            copyDefaultPids()
        }
    }

    fun loadPidFiles(): List<PidFile> {
        cachedPidFiles?.let { return it }

        val pidFiles = mutableListOf<PidFile>()
        pidFiles.addAll(loadPidsFromAssets())
        loadPidsFromInternalStorage().forEach { internalPidFile ->
            val existingIndex = pidFiles.indexOfFirst { it.manufacturer == internalPidFile.manufacturer }
            if (existingIndex != -1) {
                pidFiles[existingIndex] = internalPidFile
            } else {
                pidFiles.add(internalPidFile)
            }
        }
        cachedPidFiles = pidFiles
        return pidFiles
    }

    fun getPidFile(manufacturer: String): PidFile? {
        return loadPidFiles().find { it.manufacturer.equals(manufacturer, ignoreCase = true) }
    }

    private fun loadPidsFromAssets(): List<PidFile> {
        val pidFiles = mutableListOf<PidFile>()
        try {
            context.assets.list("pids")?.forEach { fileName ->
                val pidFileContent = context.assets.open("pids/$fileName").bufferedReader().use { it.readText() }
                pidFiles.add(gson.fromJson(pidFileContent, PidFile::class.java))
            }
        } catch (e: IOException) {
            e.printStackTrace()
        }
        return pidFiles
    }

    private fun loadPidsFromInternalStorage(): List<PidFile> {
        val pidFiles = mutableListOf<PidFile>()
        internalPidsDir.listFiles()?.forEach { file ->
            try {
                val pidFileContent = file.readText()
                pidFiles.add(gson.fromJson(pidFileContent, PidFile::class.java))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        return pidFiles
    }

    private fun copyDefaultPids() {
        try {
            context.assets.list("pids")?.forEach { fileName ->
                val destinationFile = File(internalPidsDir, fileName)
                context.assets.open("pids/$fileName").use { input ->
                    destinationFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
            }
        } catch (e: IOException) {
            e.printStackTrace()
        }
    }

    fun savePidFile(fileName: String, content: String) {
        val file = File(internalPidsDir, fileName)
        file.writeText(content)
        cachedPidFiles = null // Invalidate cache
    }
}