<template>
  <div class="container" v-loading.fullscreen.lock="loading">

      <!-- <h1 class="bonus-header">Other Bonus</h1> -->
      <!-- <el-button type="danger" @click="goBackToOverview">
        <el-icon><ArrowLeft /></el-icon> Back
      </el-button> -->
      <el-breadcrumb  :separator-icon="ArrowRight" style="font-size: 2rem; margin-bottom: 20px;">
    <el-breadcrumb-item :to="homeRoute"><h1 class="bonus-header">Other Bonus</h1></el-breadcrumb-item>
    <el-breadcrumb-item style="font-size: 2rem;">
      detail
    </el-breadcrumb-item>

  </el-breadcrumb>

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

        <el-form-item label="Search Name or Account" label-position="top">
          <el-input
            v-model="nameAccountQuery"
            placeholder="Name or Account..."
            style="width: 200px"
            clearable
            @input="handleNameAccountSearchChange"
          ></el-input>
        </el-form-item>

        <el-form-item label="Search" label-position="top">
          <!-- Show 'Branch Code' filter select -->
          <!-- v-if="selectedFilter === 'BRANCH_CODE'" -->
          <el-select
            v-model="searchQuery"
            placeholder="Select department"
            style="width: 300px"
            clearable
          >
            <el-option
              v-for="branch in branchData"
              :key="branch.DEP"
              :label="branch.DEP_NAME"
              :value="branch.DEP"
            ></el-option>
          </el-select>
        </el-form-item>
        <!-- <el-form-item label="Filter By" label-position="top">
          <el-select
            v-model="selectedFilter"
            placeholder="Select Field"
            style="width: 150px"
            @change="resetSearchQuery"
          >
            <el-option label="Branch Code" value="BRANCH_CODE"></el-option>
          </el-select>
        </el-form-item> -->
      </div>

      <!-- <el-button type="primary" style="margin-top: 20px" @click="openDialog">+ upload</el-button> -->
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
      <!-- Dynamic Columns -->
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width || 'auto'"
        :formatter="col.formatter || defaultFormatter"
        :filters="col.prop === 'STATUS' ? statusFilters : null"
        :filter-method="col.prop === 'STATUS' ? filterStatus : null"
      >
        <template #default="scope">
          <!-- Custom rendering for index -->
          <span v-if="col.prop === 'index'">{{ indexMethod(scope.$index) }}</span>
          <!-- Custom rendering for STATUS -->
          <el-tag
            v-else-if="col.prop === 'STATUS'"
            :type="scope.row.STATUS === 'N' ? 'primary' : 'danger'"
          >
            {{ scope.row.STATUS === 'N' ? 'Normal' : scope.row.STATUS === 'I' ? 'Inactive' : 'Unknown' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="Action" min-width="60">
        <template #default="scope">
          <el-button :icon="Edit" circle type="primary" @click="handleEdit(scope.row)"></el-button>
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
        <h2 class="dialog-title">
          {{ isEditMode ? 'Edit Other Bonus' : 'Upload Other Bonus' }}
        </h2>
      </template>

      <el-form label-width="120px">
        <el-form-item label="Month">
          <el-date-picker
            v-model="newBonus.MONTH_TX"
            type="month"
            format="YYYYMM"
            value-format="YYYYMM"
            placeholder="Choose a month"
            :disabled="isEditMode"
          />
        </el-form-item>

        <el-form-item label="Form" v-if="!isEditMode">
          <el-button plain type="success" @click="downloadFormExcel" :loading="loading">
            <el-icon><Download /></el-icon>&nbsp;Excel
          </el-button>
        </el-form-item>

        <el-form-item label="Upload Excel" v-if="!isEditMode">
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

        <el-form-item label="ACC NO" v-if="isEditMode">
          <el-input
            v-model="newBonus.ACC_NO"
            placeholder="Enter acc no"
            :disabled="isEditMode"
          ></el-input>
        </el-form-item>
        <el-form-item label="Amount" v-if="isEditMode">
          <el-input
            v-model="newBonus.AMOUNT"
            placeholder="Enter amount"
            :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
            @input="validateAmount"
            :disabled="isEditMode"
          ></el-input>
        </el-form-item>
        <el-form-item label="Tax Amount" v-if="isEditMode">
          <el-input
            v-model="newBonus.TAX_AMOUNT"
            placeholder="Enter tax"
            :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
            @input="validateTaxAmount"
            :disabled="isEditMode"
          ></el-input>
        </el-form-item>
        <el-form-item label="Bonus Describe">
          <el-input
            v-model="newBonus.BONUS_DESC"
            placeholder="Enter bonus desc"
            :disabled="isEditMode"
          ></el-input>
        </el-form-item>
        <el-form-item label="Status" v-if="isEditMode">
          <el-select v-model="updateStatus" placeholder="Select Status" style="width: 200px">
            <el-option label="Inactive" value="I"></el-option>
            <el-option label="Normal" value="N"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">Cancel</el-button>
        <el-button type="primary" @click="submitBonus" :loading="loading">{{
          isEditMode ? 'Update' : 'Upload'
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx' // Import xlsx library
import { ArrowLeft, ArrowRight, Download, Edit, UploadFilled } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const ApiUrl = import.meta.env.VITE_API_URL
const route = useRoute()
const router = useRouter()
const monthFilter = ref('')
// const selectedFilter = ref('BRANCH_CODE') // Default filter field
const searchQuery = ref('')// Holds DEP code (e.g., "LVB010026")
const nameAccountQuery = ref('')
const originalData = ref([])
const branchData = ref([])// Holds DEPARTMENT array
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
const isEditMode = ref(false) // New flag to track edit mode
const updateStatus = ref(null)

const loading = ref(false)
const fileList = ref([]) // To store uploaded file list
// Store Excel data separately from newBonus
const excelData = ref([])
const nameUSER = ref('')
const currentMonthTx = ref('')
const columns = ref([]) // New reactive variable for dynamic columns
// Define filter options for STATUS column
const statusFilters = ref([
  { text: 'Normal', value: 'N' },
  { text: 'Inactive', value: 'I' },
])


onMounted(() => {
  currentMonth()

  // Check for query parameters from overviewAll.vue
  const queryMonth = route.query.MONTH_TX
  const queryBonusDesc = route.query.BONUS_DESC
  const queryNameUser = route.query.nameUSER

  if (queryMonth) {
    monthFilter.value = queryMonth
    newBonus.value.MONTH_TX = queryMonth
  }
  if (queryBonusDesc) {
    newBonus.value.BONUS_DESC = queryBonusDesc
  }
  if (queryNameUser) {
    nameUSER.value = queryNameUser
    newBonus.value.USER_ID = queryNameUser
  } else {
    nameUSER.value = route.query.nameUSER // Fallback to default route param
    newBonus.value.USER_ID = nameUSER.value
  }
  
  fetchData()
  fetchAllBranch()
})

// Computed properties for breadcrumb routes
const homeRoute = computed(() => ({
  path: '/',
  query: {
    nameUSER: nameUSER.value || route.query.nameUSER,
  },
}))
// Back to Overview
const goBackToOverview = () => {
  router.push({
    path: '/', // Navigate to overviewAll.vue
    query: {
      nameUSER: nameUSER.value || route.query.nameUSER, // Preserve nameUSER
    },
  })
}

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
      ACC_NO: '',
      AMOUNT: '',
      TAX_AMOUNT: '',
      BONUS_DESC: newBonus.value.BONUS_DESC || '',
      BRANCH_CODE: '',
      EMP_DEP_ID: '',
      USER_ID: nameUSER.value,
      STATUS: '',
    }
    const response = await axios.post(ApiUrl + '/Procedure/SLR_OTHER_BONUS_READ', body, {
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
    ACC_NO: 'Account No.', // Custom name for ACC_NO
    AMOUNT: 'Amount', // Custom name for AMOUNT
    TAX_AMOUNT: 'Tax Amount', // Custom name for TAX_AMOUNT
    BONUS_DESC: 'Description', // Custom name for BONUS_DESC
    BRANCH_CODE: 'Branch', // Custom name for BRANCH_CODE
    EMP_FULLNAME: 'Full Name',
    EMP_DEP_ID: 'Dept ID', // Custom name for EMP_DEP_ID
    USER_ID: 'User', // Custom name for USER_ID
    STATUS: 'Status', // Custom name for STATUS
    CREATE_DATE: 'Created On', // Custom name for CREATE_DATE
    BONUSTYPE: 'Bonus Category', // Custom name for BONUSTYPE
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
    ACC_NO: '150',
    AMOUNT: '120',
    TAX_AMOUNT: '120',
    BONUS_DESC: '200',
    BRANCH_CODE: '120',
    EMP_DEP_ID: '120',
    USER_ID: '120',
    STATUS: '100',
    CREATE_DATE: '150',
    BONUSTYPE: '120',
  }
  return widthMap[key] || 'auto'
}

// Helper to assign formatters based on key
const getColumnFormatter = (key) => {
  if (key === 'MONTH_TX') return formatMonth
  if (key === 'AMOUNT' || key === 'TAX_AMOUNT') return formatAmount
  return null // Default formatter will be applied if null
}

// Default formatter for unformatted columns
const defaultFormatter = (row, column, cellValue) => {
  return cellValue !== null && cellValue !== undefined ? cellValue : '-'
}

//handleMonthChange
const handleMonthChange = async (value) => {
  searchQuery.value = '' 
  nameAccountQuery.value = ''
  monthFilter.value = value
  await fetchData()
}
// New reset function for searchQuery only
const resetSearchQuery = () => {
  searchQuery.value = ''
}
// filteredData
// Filtered data (updated to map DEP code to DEP_NAME)
const filteredData = computed(() => {
  let filtered = originalData.value.filter((item) => {
    if (!monthFilter.value) return true
    return String(item.MONTH_TX) === monthFilter.value
  })

  // Apply branch code filter
  // if (searchQuery.value && selectedFilter.value === 'BRANCH_CODE') {
  if (searchQuery.value) {
    // Find the DEP_NAME corresponding to the selected DEP code
    const selectedBranch = branchData.value.find(
      (branch) => branch.DEP === searchQuery.value
    )
    const depName = selectedBranch ? selectedBranch.DEP_NAME : null
    if (depName) {
      filtered = filtered.filter((item) => {
        return item.DEP === depName // Match DEP (name) in data with DEP_NAME from branchData
      })
    }
  }

  // Apply name/account filter
  if (nameAccountQuery.value) {
    const query = nameAccountQuery.value.toLowerCase()
    filtered = filtered.filter((item) => {
      return (
        (item.EMP_FULLNAME && String(item.EMP_FULLNAME).toLowerCase().includes(query)) ||
        (item.ACC_NO && String(item.ACC_NO).toLowerCase().includes(query))
      )
    })
  }

  return filtered
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
//fetch All branch
const fetchAllBranch = async () => {
  try {
    const body = {
      BRANCH_CODE: '',
    }
    const response = await axios.post(ApiUrl + '/Procedure/BRANCH_READ', body, {
      headers: {
        DB: 'SALARY',
        'Content-Type': 'application/json',
      },
    })
    // console.log('branch', response)

    if (response.data.HEADER.ERROR_CODE === '00') {
      branchData.value = response.data.BODY[0].DEPARTMENT
    } else branchData.value = []
  } catch (error) {
    console.error('Error fetching branch:', error)
  }
}

// Formattera number
const formatAmount = (row, column, cellValue) => {
  if (cellValue === '0' || !cellValue) {
    return '-' // Return dash if AMOUNT is '0' or 0
  }
  return cellValue ? new Intl.NumberFormat().format(cellValue) : ''
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
  isEditMode.value = false
  isDialogVisible.value = true
  updateStatus.value = null
}
const closeDialog = () => {
  isDialogVisible.value = false
  isEditMode.value = false
  updateStatus.value = null
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
  await ElMessageBox.confirm(
    isEditMode.value
      ? 'Are you sure you want to update the bonus form?'
      : 'Are you sure you want to Upload the bonus form?',
    isEditMode.value ? 'Confirm Update' : 'Confirm Upload',
    {
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      type: 'warning',
    },
  )
  loading.value = true
  try {
    // Handle edit mode as before
    if (isEditMode.value) {
      const endpoint = '/Procedure/SLR_OTHER_BONUS_UPDATE'
      newBonus.value.STATUS = updateStatus.value
      const response = await axios.post(ApiUrl + endpoint, newBonus.value, {
        headers: { DB: 'SALARY', 'Content-Type': 'application/json' },
      })

      if (response.data.HEADER.ERROR_CODE === '00') {
        await fetchData()
        monthFilter.value = newBonus.value.MONTH_TX
        await handleMonthChange(newBonus.value.MONTH_TX)
        closeDialog()
        ElMessage.success('updated success!')
      } else ElMessage.success(response.data.HEADER.ERROR_DESC)
    }
    // Handle create mode with Excel data
    else {
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
    }
  } catch (error) {
    console.error(`Error ${isEditMode.value ? 'updating' : 'uploading'} bonus:`, error)
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
//format only  number
const validateAmount = (value) => {
  // Allow only numbers and decimals
  newBonus.value.AMOUNT = value.replace(/[^0-9.]/g, '')
}
const validateTaxAmount = (value) => {
  // Allow only numbers and decimals
  newBonus.value.TAX_AMOUNT = value.replace(/[^0-9.]/g, '')
}
const handleEdit = (row) => {
  isEditMode.value = true
  isDialogVisible.value = true
  // console.log('edit', row)

  // Populate newBonus with the row data
  newBonus.value = {
    MONTH_TX: row.MONTH_TX,
    ACC_NO: row.ACC_NO,
    AMOUNT: row.AMOUNT,
    TAX_AMOUNT: row.TAX_AMOUNT,
    BONUS_DESC: row.BONUS_DESC,
    USER_ID: row.USER_ID,
    // STATUS: row.STATUS,
    // Add any other fields that might be needed for editing
  }
  updateStatus.value = row.STATUS
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
      ElMessage.error('Error downloading form', error)
    }
  } finally {
    loading.value = false
  }
}

// Filter method for STATUS column
const filterStatus = (value, row) => {
  return row.STATUS === value
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
