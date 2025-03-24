<template>
  <div class="container" v-loading.fullscreen.lock="loading">
    <h1>Bonus</h1>

    <!-- Filter Form -->
    <el-form :inline="false" class="filter-form">
      <div style="margin-top: 10px; display: flex; gap: 10px">
        <el-form-item label="Search" label-position="top">
          <!-- Only show input if the selected filter is not 'Status' or 'Branch Code' -->
          <el-input
            v-if="selectedFilter !== 'STATUS' && selectedFilter !== 'BRANCH_CODE'"
            v-model="searchQuery"
            clearable
            @clear="resetFilter"
            placeholder="Enter search value"
            style="width: 200px"
          ></el-input>

          <!-- Show 'Status' filter select -->
          <el-select
            v-if="selectedFilter === 'STATUS'"
            v-model="searchQuery"
            placeholder="Select Status"
            style="width: 200px"
          >
            <el-option label="Inactive" value="I"></el-option>
            <el-option label="Normal" value="N"></el-option>
          </el-select>

          <!-- Show 'Branch Code' filter select -->
          <el-select
            v-if="selectedFilter === 'BRANCH_CODE'"
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
            <el-option label="Branch Code" value="BRANCH_CODE"></el-option>
            <el-option label="User ID" value="USER_ID"></el-option>
            <el-option label="Status" value="STATUS"></el-option>
          </el-select>
        </el-form-item>
      </div>

      <el-button type="primary" style="margin-top: 20px" @click="openDialog">New</el-button>
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
      <el-table-column label="Status" prop="STATUS"></el-table-column>
      <el-table-column label="Create Date" prop="CREATE_DATE"></el-table-column>
      <el-table-column label="Bonus Type" prop="BONUSTYPE"></el-table-column>
      <el-table-column fixed="right" label="Action" min-width="60">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="handleEdit(scope.row)"
            >edit</el-button
          >
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
      :title="isEditMode ? 'Edit Bonus' : 'Add New Bonus'"
      width="600px"
      @close="closeDialog"
    >
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
        <el-form-item label="Account No">
          <!-- <el-input v-model="newBonus.ACC_NO" placeholder="will be select"></el-input> -->
          <el-autocomplete
            v-model="newBonus.ACC_NO"
            :fetch-suggestions="querySearch"
            placeholder="Select acc no"
            style="width: 200px"
            :debounce="300"
            clearable
            :trigger-on-focus="true"
            @select="selectAccno"
            :disabled="isEditMode"
          >
            <template #default="{ item }">
              <div>{{ item.EMP_FULLNAME }} - {{ item.EMP_ACCOUNT_LAK }}</div>
            </template>
          </el-autocomplete>
        </el-form-item>
        <el-form-item label="Amount">
          <el-input
            v-model="newBonus.AMOUNT"
            placeholder="Enter amount"
            :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
            @input="validateAmount"
            :disabled="isEditMode"
          ></el-input>
        </el-form-item>
        <el-form-item label="Tax Amount">
          <el-input
            v-model="newBonus.TAX_AMOUNT"
            :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
            @input="validateTaxAmount"
            placeholder="Enter tax amount"
            :disabled="isEditMode"
          ></el-input>
        </el-form-item>
        <el-form-item label="Bonus Describe">
          <el-input v-model="newBonus.BONUS_DESC" placeholder="Enter bonus desc" :disabled="isEditMode"></el-input>
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
        <el-button type="primary" @click="submitBonus">Submit</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

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
  USER_ID: 'SOUKSAN',
})
const isEditMode = ref(false) // New flag to track edit mode
const updateStatus = ref(null)

const loading = ref(false)

onMounted(() => {
  fetchData()
  fetchAllBranch()
  fetchAccNo()
})
//fetch data
const fetchData = async () => {
  loading.value = true
  try {
    const body = {
      MONTH_TX: '',
      ACC_NO: '',
      AMOUNT: '',
      TAX_AMOUNT: '',
      BONUS_DESC: '',
      BRANCH_CODE: '',
      EMP_DEP_ID: '',
      USER_ID: '',
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
    } else originalData.value = []
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    loading.value = false
  }
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
    console.log('branch', response)

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
    console.log('accno', response)

    if (response.data.HEADER.ERROR_CODE === '00') {
      accNoData.value = response.data.BODY
    } else accNoData.value = []
  } catch (error) {
    console.error('Error fetching Acc_no:', error)
  }
}
//filter autocomplate
const querySearch = (queryString, cb) => {
  const results = queryString
    ? accNoData.value.filter((item) => {
        return (
          item.EMP_FULLNAME.toLowerCase().includes(queryString.toLowerCase()) ||
          item.EMP_ACCOUNT_LAK.includes(queryString)
        )
      })
    : accNoData.value
  cb(results)
}
const selectAccno = (selectedItem) => {
  console.log('Selected Account:', selectedItem)
  newBonus.value.ACC_NO = selectedItem.EMP_ACCOUNT_LAK
}
// Formattera number
const formatAmount = (row, column, cellValue) => {
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
  newBonus.value = {
    MONTH_TX: '',
    ACC_NO: '',
    AMOUNT: '',
    TAX_AMOUNT: '',
    BONUS_DESC: '',
    USER_ID: '',
  }
}
// Submit Bonus
const submitBonus = async () => {
  loading.value = true
  console.log('body=', newBonus.value)
  try {
    let endpoint = '/Procedure/SLR_OTHER_BONUS_CREATE'
    if (isEditMode.value) {
      endpoint = '/Procedure/SLR_OTHER_BONUS_UPDATE' // Assuming you have an update endpoint
      // Add the identifier to the payload if needed
      newBonus.value.STATUS = updateStatus.value
    }

    const response = await axios.post(ApiUrl + endpoint, newBonus.value, {
      headers: { DB: 'SALARY', 'Content-Type': 'application/json' },
    })
    console.log('response', response.data)

    if (response.data.HEADER.ERROR_CODE === '00') {
      fetchData()
      closeDialog()
    } else {
      console.error(
        `Failed to ${isEditMode.value ? 'update' : 'create'} bonus:`,
        response.data.HEADER.ERROR_MESSAGE,
      )
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
</style>
