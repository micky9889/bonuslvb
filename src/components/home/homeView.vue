<template>
  <div class="container" v-loading.fullscreen.lock="loading">
    <h1  class="bonus-header">Bonus</h1>

    <!-- Filter Form -->
    <el-form :inline="false" class="filter-form">
      <div style="margin-top: 10px; display: flex; gap: 10px">
        <el-form-item label="Search" label-position="top">
          <!-- Show month picker for 'Month' filter -->
          <el-date-picker
            v-if="selectedFilter === 'MONTH_TX'"
            v-model="searchQuery"
            type="month"
            format="YYYYMM"
            value-format="YYYYMM"
            placeholder="Select Month"
            style="width: 200px"
            clearable
            @change="handleMonthChange"
          ></el-date-picker>
          <!-- Show 'Status' filter select -->
          <el-select
            v-else-if="selectedFilter === 'STATUS'"
            v-model="searchQuery"
            placeholder="Select Status"
            style="width: 200px"
          >
            <el-option label="Inactive" value="I"></el-option>
            <el-option label="Normal" value="N"></el-option>
          </el-select>

          <!-- Show 'Branch Code' filter select -->
          <el-select
            v-else-if="selectedFilter === 'BRANCH_CODE'"
            v-model="searchQuery"
            placeholder="Select Branch Code"
            style="width: 200px"
          >
            <el-option
              v-for="branch in branchData"
              :key="branch.BRANCH"
              :label="branch.BRANCH + ' - ' + branch.BRANCH_NAME"
              :value="branch.BRANCH"
            ></el-option>
          </el-select>
          <!-- Show input for other filters -->
          <el-input
            v-else
            v-model="searchQuery"
            clearable
            @clear="resetFilter"
            placeholder="Enter search value"
            style="width: 200px"
          ></el-input>
        </el-form-item>

        <el-form-item label="Filter By" label-position="top">
          <el-select
            v-model="selectedFilter"
            placeholder="Select Field"
            style="width: 150px"
            @change="resetFilter"
          >
            <el-option label="Month" value="MONTH_TX"></el-option>
            <!-- <el-option label="Employee ID" value="EMP_ID"></el-option> -->
            <el-option label="Account No" value="ACC_NO"></el-option>
            <!-- <el-option label="Branch Code" value="BRANCH_CODE"></el-option> -->
            <!-- <el-option label="User ID" value="USER_ID"></el-option> -->
            <el-option label="Status" value="STATUS"></el-option>
          </el-select>
        </el-form-item>
      </div>

      <el-button type="primary" style="margin-top: 20px" @click="openDialog">+</el-button>
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
      <el-table-column label="#" type="index" :index="indexMethod" width="50"></el-table-column>
      <el-table-column label="Month" prop="MONTH_TX" :formatter="formatMonth"></el-table-column>
      <!-- <el-table-column label="Employee ID" prop="EMP_ID"></el-table-column> -->
      <el-table-column label="Account Number" prop="ACC_NO"></el-table-column>
      <el-table-column label="Amount" prop="AMOUNT" :formatter="formatAmount"></el-table-column>
      <el-table-column
        label="Tax Amount"
        prop="TAX_AMOUNT"
        :formatter="formatAmount"
      ></el-table-column>
      <el-table-column label="Bonus Description" prop="BONUS_DESC"></el-table-column>
      <el-table-column label="Branch Code" prop="BRANCH_CODE"></el-table-column>
      <el-table-column label="Department ID" prop="EMP_DEP_ID"></el-table-column>
      <el-table-column label="User ID" prop="USER_ID"></el-table-column>
      <el-table-column label="Status" prop="STATUS">
        <template #default="scope">
          <el-tag :type="scope.row.STATUS === 'N' ? 'primary' : 'danger'">{{
            scope.row.STATUS === 'N' ? 'Normal' : 'Inactive'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Create Date" prop="CREATE_DATE"></el-table-column>
      <el-table-column label="Bonus Type" prop="BONUSTYPE"></el-table-column>
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
    <el-dialog
      v-model="isDialogVisible"
      width="600px"
      @close="closeDialog"
    >
    <template #header>
    <h2 class="dialog-title">
      {{ isEditMode ? 'Edit Bonus' : 'Upload Bonus' }}
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
          isEditMode ? 'Update' : 'Create'
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx' // Import xlsx library
import { Edit, UploadFilled } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const ApiUrl = import.meta.env.VITE_API_URL
const selectedFilter = ref('MONTH_TX') // Default filter field
const searchQuery = ref('')

const originalData = ref([
  /* Your data here */
])
const branchData = ref([
  /* Your data here */
])
const accNoData = ref([
  /* Your data here */
])

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

onMounted(() => {
  fetchData()
  fetchAllBranch()
  fetchAccNo()
  currentMonth()

  //get value params
  nameUSER.value = route.query.nameUSER

  if (nameUSER.value) {
    // console.log('nameUSER:', nameUSER.value) // e.g., "mick"
    // Use the values as needed, e.g., set them in your form
    newBonus.value.USER_ID = nameUSER.value // Example usage
  }
})

//current month
const currentMonth = () => {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = String(currentDate.getMonth() + 1).padStart(2, '0') // Months are 0-based, so add 1
  currentMonthTx.value = `${year}${month}`
  searchQuery.value = currentMonthTx.value
  newBonus.value.MONTH_TX = currentMonthTx.value
}
//fetch data
const fetchData = async () => {
  loading.value = true
  try {
    const body = {
      MONTH_TX: searchQuery.value, //currentMonthTx.value
      ACC_NO: '',
      AMOUNT: '',
      TAX_AMOUNT: '',
      BONUS_DESC: '',
      BRANCH_CODE: '',
      EMP_DEP_ID: '',
      USER_ID: nameUSER.value || route.query.nameUSER,
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
      // console.log('Fetched data:', originalData.value)
    } else originalData.value = []
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    loading.value = false
  }
}
const handleMonthChange = async(value) => {
  searchQuery.value = value // Value is already in YYYYMM format due to value-format
  await fetchData()
}
//filter data
const filteredData = computed(() => {
  if (!searchQuery.value) return originalData.value
  return originalData.value.filter((item) => {
    const fieldValue = item[selectedFilter.value]
    if (fieldValue !== undefined) {
      return String(fieldValue).toLowerCase().includes(searchQuery.value.toLowerCase())
    }
    return false
  })
})
//reset
const resetFilter = () => {
  searchQuery.value = ''
}
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
      branchData.value = response.data.BODY
    } else branchData.value = []
  } catch (error) {
    console.error('Error fetching branch:', error)
  }
}
//fetch All acc no
const fetchAccNo = async () => {
  try {
    const body = {
      BRANCH: '',
    }
    const response = await axios.post(ApiUrl + '/Procedure/SLR_OTHER_BONUS_FORM_READ', body, {
      headers: {
        DB: 'SALARY',
        'Content-Type': 'application/json',
      },
    })
    // console.log('accno', response)

    if (response.data.HEADER.ERROR_CODE === '00') {
      accNoData.value = response.data.BODY
    } else accNoData.value = []
  } catch (error) {
    console.error('Error fetching Acc_no:', error)
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
        searchQuery.value = newBonus.value.MONTH_TX
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
        searchQuery.value = newBonus.value.MONTH_TX
        await handleMonthChange(newBonus.value.MONTH_TX)
        closeDialog()
      }
    }
  } catch (error) {
    console.error(`Error ${isEditMode.value ? 'updating' : 'submitting'} bonus:`, error)
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
.dialog-title{
  font-size: 1.2rem; /* ปรับขนาดใหญ่ */
  font-weight: bold; /* ทำให้ตัวหนา */
  text-transform: uppercase; /* เปลี่ยนเป็นตัวพิมพ์ใหญ่ */
  border-left: 5px solid #1d87f8; /* เส้นขีดซ้าย */
  padding-left: 10px; /* เพิ่มระยะห่างระหว่างเส้นกับข้อความ */
  line-height: 1; /* ป้องกันเส้นสูงเกินไป */
}
</style>
