<template>
  <div class="container" v-loading.fullscreen.lock="loading">
    <h1 class="bonus-header" style=" margin-bottom: 20px;">Other Bonus</h1>

    <!-- Filter Form -->
    <el-form :inline="false" class="filter-form">
      <div style="margin-top: 10px; display: flex; gap: 10px">
        <el-form-item label="Month" label-position="top">
          <el-date-picker
            v-model="monthFilter"
            type="month"
            format="YYYYMM"
            value-format="YYYYMM"
            placeholder="Select Month"
            style="width: 200px"
            clearable
            @change="handleMonthChange"
          ></el-date-picker>
        </el-form-item>

        <el-form-item label="Search" label-position="top">
          <el-input
            v-model="searchQuery"
            placeholder="Search..."
            style="width: 200px"
            clearable
            @input="handleSearchChange"
          ></el-input>
        </el-form-item>
      </div>

      <el-button type="primary" style="margin-top: 20px" @click="openDialog">+ upload</el-button>
    </el-form>

    <!-- Table -->
    <el-table
      :data="paginatedData"
      style="width: 100%"
      border
      stripe
      :max-height="800"
      :scroll-x="true"
    >
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width || 'auto'"
        :formatter="col.formatter || defaultFormatter"
      >
        <template #default="scope">
          <!-- Custom rendering for index -->
          <span v-if="col.prop === 'index'">{{ indexMethod(scope.$index) }}</span>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="Action" width="150">
        <template #default="scope">
          <el-button :icon="View" circle type="primary" @click="handleView(scope.row)"></el-button>
          <el-button
            :icon="Delete"
            circle
            type="danger"
            @click="handleDelete(scope.row)"
          ></el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <el-pagination
      class="pagination"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="filteredData.length"
      :page-sizes="[5, 10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    ></el-pagination>
    <!-- Dialog for New Bonus -->
    <el-dialog v-model="isDialogVisible" width="600px" @close="closeDialog">
      <template #header>
        <h2 class="dialog-title">Upload Other Bonus</h2>
      </template>

      <el-form label-width="120px">
        <el-form-item label="Month">
          <el-date-picker
            v-model="newBonus.MONTH_TX"
            type="month"
            format="YYYYMM"
            value-format="YYYYMM"
            placeholder="Choose a month"
          />
        </el-form-item>

        <el-form-item label="Form">
          <el-button plain type="success" @click="downloadFormExcel" :loading="loading">
            <el-icon><Download /></el-icon>&nbsp;Excel
          </el-button>
        </el-form-item>

        <el-form-item label="Upload Excel">
          <el-upload
            drag
            accept=".xlsx, .xls"
            :auto-upload="false"
            :on-change="handleFileUpload"
            :file-list="fileList"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
            <template #tip>
              <div class="el-upload__tip">Excel files only (.xlsx, .xls)</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="Bonus Describe">
          <el-input v-model="newBonus.BONUS_DESC" placeholder="Enter bonus desc"></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">Cancel</el-button>
        <el-button type="primary" @click="submitBonus" :loading="loading"> Upload </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx' // Import xlsx library
import { Close, Delete, Download, Edit, UploadFilled, View } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const ApiUrl = import.meta.env.VITE_API_URL
const route = useRoute()
const router = useRouter()
const monthFilter = ref('')
const selectedFilter = ref('STATUS') // Default filter field
const searchQuery = ref('')
const originalData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const isDialogVisible = ref(false)
const newBonus = ref({
  MONTH_TX: '',
  ACC_NO: '',
  AMOUNT: '',
  TAX_AMOUNT: '',
  BONUS_DESC: '',
  USER_ID: '',
})

const loading = ref(false)
const fileList = ref([]) // To store uploaded file list
// Store Excel data separately from newBonus
const excelData = ref([])
const nameUSER = ref('')
const currentMonthTx = ref('')
const columns = ref([]) // New reactive variable for dynamic columns

onMounted(() => {
  currentMonth()
  fetchData()

  //get value params
  nameUSER.value = route.query.nameUSER
  if (nameUSER.value) {
    newBonus.value.USER_ID = nameUSER.value
  }
})

//current month
const currentMonth = () => {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = String(currentDate.getMonth() + 1).padStart(2, '0') // Months are 0-based, so add 1
  currentMonthTx.value = `${year}${month}`
  monthFilter.value = currentMonthTx.value
  newBonus.value.MONTH_TX = currentMonthTx.value
}
//fetch data
const fetchData = async () => {
  loading.value = true
  try {
    const body = {
      MONTH_TX: monthFilter.value,
      USER_ID: nameUSER.value || route.query.nameUSER,
    }
    const response = await axios.post(ApiUrl + '/Procedure/SLR_OTHER_BONUS_LIST', body, {
      headers: {
        DB: 'SALARY',
        'Content-Type': 'application/json',
      },
    })
    if (response.data.HEADER.ERROR_CODE === '00') {
      originalData.value = response.data.BODY
      setDynamicColumns(response.data.BODY) // Set columns based on response
      // console.log('Fetched data:', originalData.value)
    } else {
      originalData.value = []
      columns.value = []
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    loading.value = false
  }
}
// Function to dynamically set columns based on response
const setDynamicColumns = (data) => {
  if (data.length === 0) {
    columns.value = []
    return
  }
  // Define custom label mappings
  const customLabels = {
    index: 'No.', // Custom name for the # column
    MONTH_TX: 'Month', // Custom name for MONTH_TX
    BONUS_DESC: 'Description', // Custom name for BONUS_DESC
  }

  // Get all unique keys from the first object (or all objects if needed)
  const firstItem = data[0]
  const dynamicColumns = Object.keys(firstItem).map((key) => {
    return {
      prop: key,
      label: customLabels[key] || formatLabel(key), // Use custom label if defined, otherwise fallback to formatLabel
      width: getColumnWidth(key), // Optional: Set width based on key
      formatter: getColumnFormatter(key), // Optional: Assign formatter
    }
  })

  // Set only the dynamic data columns (exclude '#')
  // columns.value = dynamicColumns

  columns.value = [
    {
      prop: 'index', // Use a dummy prop name
      label: customLabels['index'] || '#', // Use custom label for index
      width: '50',
    },
    ...dynamicColumns,
  ]
}

// Helper to format column labels (e.g., EMP_FULLNAME -> Employee Fullname)
const formatLabel = (key) => {
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Helper to assign width based on key (optional customization)
const getColumnWidth = (key) => {
  const widthMap = {
    MONTH_TX: '100',
  }
  return widthMap[key] || 'auto'
}

// Helper to assign formatters based on key
const getColumnFormatter = (key) => {
  if (key === 'MONTH_TX') return formatMonth
  return null // Default formatter will be applied if null
}

// Default formatter for unformatted columns
const defaultFormatter = (row, column, cellValue) => {
  return cellValue !== null && cellValue !== undefined ? cellValue : '-'
}

//handleMonthChange
const handleMonthChange = async (value) => {
//   searchQuery.value = ''
  monthFilter.value = value
  await fetchData()
}
const handleSearchChange = () => {
  // No need to reset anything; filtering happens in filteredData
}
// filteredData
const filteredData = computed(() => {
  let filtered = originalData.value.filter((item) => {
    if (!monthFilter.value) return true
    return String(item.MONTH_TX) === monthFilter.value
  })

  if (!searchQuery.value) return filtered

  const query = searchQuery.value.toLowerCase()
  return filtered.filter((item) => {
    return (
      String(item.MONTH_TX).toLowerCase().includes(query) ||
      (item.BONUS_DESC && String(item.BONUS_DESC).toLowerCase().includes(query))
    )
  })
})

//pagination
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}
//index row table
const indexMethod = (index) => {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

const formatMonth = (row, column, cellValue) => {
  if (cellValue) {
    const year = cellValue.slice(0, 4)
    const month = cellValue.slice(4, 6)
    return `${year}-${month}`
  }
  return ''
}
// Open and Close Dialog
const openDialog = () => {
  isDialogVisible.value = true
}
const closeDialog = () => {
  isDialogVisible.value = false
  fileList.value = [] // Reset file list
  excelData.value = [] // Reset Excel data
  newBonus.value = {
    MONTH_TX: currentMonthTx.value,
    ACC_NO: '',
    AMOUNT: '',
    TAX_AMOUNT: '',
    BONUS_DESC: '',
    USER_ID: nameUSER.value,
  }
}
// Submit Bonus
const submitBonus = async () => {
  // Show confirmation popup
  await ElMessageBox.confirm('Are you sure you want to Upload the bonus form?', 'Confirm Upload', {
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    type: 'warning',
  })
  loading.value = true
  try {
    // Handle create mode with Excel data
    if (!newBonus.value.MONTH_TX || excelData.value.length === 0) {
      ElMessage.error('Month and File are required')
      return
    }
    // console.log('exceldata=', excelData.value.length)
    else {
      // Loop through Excel data and submit each row
      const endpoint = '/Procedure/SLR_OTHER_BONUS_CREATE'
      for (const row of excelData.value) {
        const bonusData = {
          MONTH_TX: newBonus.value.MONTH_TX,
          ACC_NO: String(row.EMP_ACCOUNT_LAK),
          AMOUNT: row.AMOUNT || '0',
          TAX_AMOUNT: row.TAX_AMOUNT || '0',
          BONUS_DESC: newBonus.value.BONUS_DESC,
          USER_ID: newBonus.value.USER_ID,
        }
        // console.log('bodycreate=', bonusData)
        try {
          const response = await axios.post(ApiUrl + endpoint, bonusData, {
            headers: { DB: 'SALARY', 'Content-Type': 'application/json' },
          })

          if (response.data.HEADER.ERROR_CODE === '00') {
            ElMessage.success('upload success')
          } else if (response.data.HEADER.ERROR_CODE !== '00') {
            ElMessage.error(response.data.HEADER.ERROR_DESC)
          } else ElMessage.error(response.data.HEADER.ERROR_DESC)
        } catch (error) {
          console.error(`Error submitting bonus for:`, error)
        }
      }
      // Refresh data and close dialog after all submissions
      await fetchData()
      monthFilter.value = newBonus.value.MONTH_TX
      await handleMonthChange(newBonus.value.MONTH_TX)
      closeDialog()
    }
  } catch (error) {
    console.error(`Error uploading} bonus:`, error)
    if (error === 'cancel') {
      ElMessage.info('upload canceled')
    } else {
      console.error('Error upload form:', error)
      ElMessage.error('Error upload form')
    }
  } finally {
    loading.value = false
  }
}
// Handle View
const handleView = (row) => {
  router.push({
    path: '/home',
    query: {
      MONTH_TX: row.MONTH_TX,
      BONUS_DESC: row.BONUS_DESC,
      nameUSER: nameUSER.value || route.query.nameUSER,
    },
  })
}
//remove bonus
const handleDelete = async (row) => {
  try {
    // Show confirmation popup before deletion
    await ElMessageBox.confirm(
      `Are you sure you want to delete the bonus for ${row.MONTH_TX} - ${row.BONUS_DESC}?`,
      'Confirm Deletion',
      {
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        type: 'warning',
      },
    )

    loading.value = true

    // Prepare the request body based on the row data
    const body = {
      MONTH_TX: row.MONTH_TX,
      BONUS_DESC: row.BONUS_DESC,
      USER_ID: nameUSER.value || route.query.nameUSER, // Use the current user's ID
    }

    // API call to delete the bonus
    const response = await axios.post(ApiUrl + '/Procedure/SLR_OTHER_BONUS_DELETE', body, {
      headers: {
        DB: 'SALARY',
        'Content-Type': 'application/json',
      },
    })

    // Check API response
    if (response.data.HEADER.ERROR_CODE === '00') {
      ElMessage.success('Bonus deleted successfully!')
      // Refresh the table data after deletion
      await fetchData()
    } else {
      ElMessage.error(response.data.HEADER.ERROR_DESC || 'Failed to delete bonus')
    }
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('Deletion canceled')
    } else {
      console.error('Error deleting bonus:', error)
      ElMessage.error('Error deleting bonus')
    }
  } finally {
    loading.value = false
  }
}

// Add new method to handle file upload
const handleFileUpload = (file) => {
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

      // Convert sheet to JSON and store all rows
      excelData.value = XLSX.utils.sheet_to_json(firstSheet)
      // console.log('row=', excelData.value)
    } catch (error) {
      console.error('Error reading Excel file:', error)
      // You might want to show an error message to the user here
    }
  }

  reader.readAsArrayBuffer(file.raw)
  fileList.value = [file] // Update file list
}

// Download form Excel
const downloadFormExcel = async () => {
  // Show confirmation popup
  await ElMessageBox.confirm(
    'Are you sure you want to download the bonus form?',
    'Confirm Download',
    {
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      type: 'warning',
    },
  )
  loading.value = true
  try {
    const body = {
      BRANCH: nameUSER.value,
    }
    const response = await axios.post(ApiUrl + '/Procedure/SLR_OTHER_BONUS_FORM_READ', body, {
      headers: {
        DB: 'SALARY',
        'Content-Type': 'application/json',
      },
    })

    if (response.data.HEADER.ERROR_CODE === '00') {
      const formData = response.data.BODY

      // Map data to required columns
      const templateData = formData.map((item) => ({
        NO: item.NO,
        EMP_FULLNAME: item.EMP_FULLNAME,
        EMP_ACCOUNT_LAK: item.EMP_ACCOUNT_LAK,
        AMOUNT: item.AMOUNT,
        TAX_AMOUNT: item.TAX_AMOUNT,
        DEP_NAME: item.DEP_NAME,
      }))

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(templateData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bonus Form')

      // Optional: Set column widths
      worksheet['!cols'] = [
        { wch: 5 }, // NO
        { wch: 20 }, // EMP_FULLNAME
        { wch: 20 }, // EMP_ACCOUNT_LAK
        { wch: 15 }, // AMOUNT
        { wch: 15 }, // TAX_AMOUNT
        { wch: 30 }, // DEP_NAME
      ]

      // Download the file
      const fileName = `Bonus_Form_${newBonus.value.MONTH_TX || currentMonthTx.value}.xlsx`
      XLSX.writeFile(workbook, fileName)
      ElMessage.success('Form downloaded successfully!')
    } else {
      ElMessage.error(response.data.HEADER.ERROR_DESC || 'Failed to fetch form data')
    }
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('Download canceled')
    } else {
      console.error('Error downloading form:', error)
      ElMessage.error('Error downloading form')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.container {
}

.filter-form {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Make the table scrollable */
.el-table {
  margin-top: 10px;
  overflow-x: auto;
}

.el-table th {
  background-color: #f4f4f4;
}

.el-table td {
  text-align: center;
}
.pagination {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}
.el-upload__tip {
  margin-top: 8px;
  color: #666060;
}
.bonus-header {
  font-size: 2rem; /* ปรับขนาดใหญ่ */
  font-weight: bold; /* ทำให้ตัวหนา */
  text-transform: uppercase; /* เปลี่ยนเป็นตัวพิมพ์ใหญ่ */
  border-left: 5px solid #1d87f8; /* เส้นขีดซ้าย */
  padding-left: 10px; /* เพิ่มระยะห่างระหว่างเส้นกับข้อความ */
  line-height: 1; /* ป้องกันเส้นสูงเกินไป */
}
.dialog-title {
  font-size: 1.2rem; /* ปรับขนาดใหญ่ */
  font-weight: bold; /* ทำให้ตัวหนา */
  text-transform: uppercase; /* เปลี่ยนเป็นตัวพิมพ์ใหญ่ */
  border-left: 5px solid #1d87f8; /* เส้นขีดซ้าย */
  padding-left: 10px; /* เพิ่มระยะห่างระหว่างเส้นกับข้อความ */
  line-height: 1; /* ป้องกันเส้นสูงเกินไป */
}
</style>
