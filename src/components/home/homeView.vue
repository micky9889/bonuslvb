<template>
  <div class="container">
    <h1>Bonus</h1>

    <!-- Filter Form -->
    <el-form :inline="false" class="filter-form">
      <el-form-item label="Search" label-position="top">
        <el-input
          v-model="searchQuery"
          clearable
          @clear="resetFilter"
          placeholder="Enter search value"
          style="width: 200px"
        ></el-input>
      </el-form-item>
      <el-form-item label="Filter By" label-position="top">
        <el-select v-model="selectedFilter" placeholder="Select Field" style="width: 150px">
          <el-option label="Month" value="MONTH_TX"></el-option>
          <el-option label="Employee ID" value="EMP_ID"></el-option>
          <el-option label="Account No" value="ACC_NO"></el-option>
          <el-option label="Branch Code" value="BRANCH_CODE"></el-option>
          <el-option label="User ID" value="USER_ID"></el-option>
          <el-option label="Status" value="STATUS"></el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <!-- Table -->
    <el-table
      :data="filteredData"
      style="width: 100%"
      border
      stripe
      :max-height="400"
      :scroll-x="true"
    >
      <el-table-column label="Month" prop="MONTH_TX"></el-table-column>
      <el-table-column label="Employee ID" prop="EMP_ID"></el-table-column>
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
    </el-table>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, computed, onMounted } from 'vue'

const selectedFilter = ref('MONTH_TX') // Default filter field
const searchQuery = ref('')

const originalData = ref([
  // {
  //   MONTH_TX: '202503',
  //   EMP_ID: 100,
  //   ACC_NO: '01000210168489',
  //   AMOUNT: 25000000,
  //   TAX_AMOUNT: 600000,
  //   BONUS_DESC: 'Lao new year bonus',
  //   BRANCH_CODE: 'LVB010',
  //   EMP_DEP_ID: 'LVB010016 ',
  //   USER_ID: 'SOUKSAN',
  //   CREATE_DATE: '2025-03-21 10:08:56',
  //   STATUS: 'N',
  //   BONUSTYPE: 'byamount'
  // },
  // {
  //   MONTH_TX: '202503',
  //   EMP_ID: 459,
  //   ACC_NO: '01000210189241',
  //   AMOUNT: 25000000,
  //   TAX_AMOUNT: 600000,
  //   BONUS_DESC: 'Lao new year bonus',
  //   BRANCH_CODE: 'LVB010',
  //   EMP_DEP_ID: 'LVB010016 ',
  //   USER_ID: 'SOUKSAN',
  //   CREATE_DATE: '2025-03-21 09:24:44',
  //   STATUS: 'N',
  //   BONUSTYPE: 'byamount'
  // }
])

onMounted(() => {
  fetchData()
})
// ดึงข้อมูลจาก API
const fetchData = async () => {
  try {
    const body= {
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
    const response = await axios.post(
      'http://10.1.2.11:3307/Procedure/SLR_OTHER_BONUS_READ',body
     ,
      {
        headers: {
          DB: 'SALARY',
          'Content-Type': 'application/json',
        },
      },
    )
    console.log('data:', response)
    if (response.data.HEADER.ERROR_CODE === '00') {
      originalData.value = response.data.BODY // สมมติว่า API ส่งข้อมูลกลับมาเป็น array
    }else  originalData.value =[]
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

// Computed property for filtering data dynamically
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

// Reset Filter
const resetFilter = () => {
  searchQuery.value = ''
}
</script>

<style scoped>
.container {
}

.filter-form {
  margin-top: 10px;
  display: flex;
  gap: 10px;
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
</style>
