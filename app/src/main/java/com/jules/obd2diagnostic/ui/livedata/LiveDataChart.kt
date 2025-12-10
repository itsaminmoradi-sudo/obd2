package com.jules.obd2diagnostic.ui.livedata

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.github.mikephil.charting.charts.LineChart
import com.github.mikephil.charting.data.Entry
import com.github.mikephil.charting.data.LineData
import com.github.mikephil.charting.data.LineDataSet

@Composable
fun LiveDataChart(
    modifier: Modifier = Modifier,
    data: List<Entry>
) {
    AndroidView(
        modifier = modifier,
        factory = { context ->
            LineChart(context).apply {
                description.isEnabled = false
                isDragEnabled = true
                setScaleEnabled(true)
                setPinchZoom(true)
            }
        },
        update = { chart ->
            val dataSet = LineDataSet(data, "Live Data")
            val lineData = LineData(dataSet)
            chart.data = lineData
            chart.invalidate()
        }
    )
}