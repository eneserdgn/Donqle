<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4">
        <h1 class="text-3xl font-bold text-gray-900">Project Tree View</h1>
      </div>
    </header>
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="flex gap-4">
        <!-- Tree View -->
        <div class="w-1/3 bg-white p-4 rounded-lg shadow">
          <Tree :value="treeData" class="w-full" selectionMode="single" 
                @node-select="onNodeSelect" @node-unselect="onNodeUnselect">
            <template #default="slotProps">
              <div class="flex items-center justify-between w-full">
                <span>{{ slotProps.node.label }}</span>
                <div class="flex gap-2">
                  <button @click.stop="editNode(slotProps.node)" 
                          class="p-1 text-blue-600 hover:text-blue-800">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button @click.stop="deleteNode(slotProps.node)" 
                          class="p-1 text-red-600 hover:text-red-800">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </div>
            </template>
          </Tree>
          <div class="mt-4">
            <Button label="Add Project" @click="showAddProjectDialog" />
          </div>
        </div>

        <!-- Details Panel -->
        <div class="w-2/3 bg-white p-4 rounded-lg shadow">
          <div v-if="selectedNode">
            <h2 class="text-xl font-semibold mb-4">{{ selectedNode.label }} Details</h2>
            <div class="space-y-4">
              <!-- Project Actions -->
              <div v-if="selectedNode.type === 'project'" class="space-y-2">
                <Button label="Add Page" @click="showAddPageDialog" />
              </div>

              <!-- Page Actions -->
              <div v-if="selectedNode.type === 'page'" class="space-y-2">
                <Button label="Add Element" @click="showAddElementDialog" />
              </div>

              <!-- Element Details -->
              <div v-if="selectedNode.type === 'element'" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Selector Type</label>
                    <Dropdown v-model="selectedNode.data.selector_type" 
                            :options="selectorTypes" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Selector Value</label>
                    <InputText v-model="selectedNode.data.selector_value" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Action Type</label>
                    <Dropdown v-model="selectedNode.data.action_type" 
                            :options="actionTypes" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Action Value</label>
                    <InputText v-model="selectedNode.data.action_value" class="w-full" />
                  </div>
                </div>
                <Button label="Save Changes" @click="saveElementChanges" />
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500 text-center">
            Select a node to view details
          </div>
        </div>
      </div>
    </main>

    <!-- Dialogs -->
    <Dialog v-model:visible="showDialog" :header="dialogHeader" modal>
      <div class="space-y-4">
        <div v-if="dialogType === 'project'">
          <label class="block text-sm font-medium text-gray-700">Project Name</label>
          <InputText v-model="newItemName" class="w-full" />
        </div>
        <div v-if="dialogType === 'page'">
          <label class="block text-sm font-medium text-gray-700">Page Name</label>
          <InputText v-model="newItemName" class="w-full" />
        </div>
        <div v-if="dialogType === 'element'">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Selector Type</label>
              <Dropdown v-model="newElement.selector_type" :options="selectorTypes" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Selector Value</label>
              <InputText v-model="newElement.selector_value" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Action Type</label>
              <Dropdown v-model="newElement.action_type" :options="actionTypes" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Action Value</label>
              <InputText v-model="newElement.action_value" class="w-full" />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" @click="hideDialog" class="p-button-text" />
        <Button label="Save" @click="saveNewItem" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Tree from 'primevue/tree'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import { supabase } from './supabase'

// State
const treeData = ref([])
const selectedNode = ref(null)
const showDialog = ref(false)
const dialogType = ref('')
const dialogHeader = ref('')
const newItemName = ref('')
const newElement = ref({
  selector_type: '',
  selector_value: '',
  action_type: '',
  action_value: ''
})

// Constants
const selectorTypes = ['id', 'class', 'name', 'xpath', 'css']
const actionTypes = ['click', 'type', 'select', 'hover', 'wait']

// Fetch Data
const fetchProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      pages:pages(
        *,
        elements:elements(*)
      )
    `)

  if (error) {
    console.error('Error fetching projects:', error)
    return
  }

  treeData.value = data.map(project => ({
    key: `project-${project.id}`,
    label: project.name,
    type: 'project',
    data: project,
    children: project.pages?.map(page => ({
      key: `page-${page.id}`,
      label: page.name,
      type: 'page',
      data: page,
      children: page.elements?.map(element => ({
        key: `element-${element.id}`,
        label: `${element.selector_type}: ${element.selector_value}`,
        type: 'element',
        data: element
      }))
    }))
  }))
}

// Event Handlers
const onNodeSelect = (node) => {
  selectedNode.value = node
}

const onNodeUnselect = () => {
  selectedNode.value = null
}

const showAddProjectDialog = () => {
  dialogType.value = 'project'
  dialogHeader.value = 'Add New Project'
  newItemName.value = ''
  showDialog.value = true
}

const showAddPageDialog = () => {
  if (!selectedNode.value || selectedNode.value.type !== 'project') return
  dialogType.value = 'page'
  dialogHeader.value = 'Add New Page'
  newItemName.value = ''
  showDialog.value = true
}

const showAddElementDialog = () => {
  if (!selectedNode.value || selectedNode.value.type !== 'page') return
  dialogType.value = 'element'
  dialogHeader.value = 'Add New Element'
  newElement.value = {
    selector_type: selectorTypes[0],
    selector_value: '',
    action_type: actionTypes[0],
    action_value: ''
  }
  showDialog.value = true
}

const hideDialog = () => {
  showDialog.value = false
}

const saveNewItem = async () => {
  try {
    if (dialogType.value === 'project') {
      await supabase
        .from('projects')
        .insert([{ name: newItemName.value }])
    } else if (dialogType.value === 'page') {
      await supabase
        .from('pages')
        .insert([{
          name: newItemName.value,
          project_id: selectedNode.value.data.id
        }])
    } else if (dialogType.value === 'element') {
      await supabase
        .from('elements')
        .insert([{
          page_id: selectedNode.value.data.id,
          ...newElement.value
        }])
    }
    
    await fetchProjects()
    hideDialog()
  } catch (error) {
    console.error('Error saving item:', error)
  }
}

const editNode = (node) => {
  selectedNode.value = node
  if (node.type === 'element') {
    // Element editing is handled in the details panel
  } else {
    dialogType.value = node.type
    dialogHeader.value = `Edit ${node.type.charAt(0).toUpperCase() + node.type.slice(1)}`
    newItemName.value = node.label
    showDialog.value = true
  }
}

const deleteNode = async (node) => {
  try {
    await supabase
      .from(node.type + 's')
      .delete()
      .eq('id', node.data.id)
    
    await fetchProjects()
  } catch (error) {
    console.error('Error deleting node:', error)
  }
}

const saveElementChanges = async () => {
  try {
    await supabase
      .from('elements')
      .update({
        selector_type: selectedNode.value.data.selector_type,
        selector_value: selectedNode.value.data.selector_value,
        action_type: selectedNode.value.data.action_type,
        action_value: selectedNode.value.data.action_value
      })
      .eq('id', selectedNode.value.data.id)
    
    await fetchProjects()
  } catch (error) {
    console.error('Error saving element changes:', error)
  }
}

// Initialize
onMounted(() => {
  fetchProjects()
})
</script>

<style>
@import 'primevue/resources/themes/lara-light-blue/theme.css';
</style>
