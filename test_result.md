# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Layer 7 stress testing panel with real server monitoring (CPU/RAM/CPU Model via SSH), server update bug fix, and improved UI for server stats display"

backend:
  - task: "Real SSH server monitoring (CPU/RAM/CPU Model)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Implemented real SSH connection via paramiko for /api/admin/servers/{id}/ping endpoint. Returns cpu_usage, ram_used, ram_total, cpu_model, cpu_cores. Tested - works correctly (shows offline with auth error for unreachable servers)"

  - task: "Real SSH command execution"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Updated /api/admin/servers/{id}/execute to use real SSH via paramiko instead of mocked local execution"

  - task: "Server update endpoint bug fix"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Tested PUT /api/admin/servers/{id} - works correctly with both simple updates and method_commands"

frontend:
  - task: "CPU Model display in Admin Servers page"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/AdminServers.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Added CPU Model section with cores count and visual progress bars for CPU and RAM usage. Shows N/A when server cannot be reached."

  - task: "Improved ping notification"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/AdminServers.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Updated toast notification to show CPU model and error messages when server ping fails"

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 2
  run_ui: true

test_plan:
  current_focus:
    - "Real SSH server monitoring"
    - "CPU Model display"
    - "Server update functionality"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Implemented real SSH monitoring via paramiko: 1) /api/admin/servers/{id}/ping now connects to actual servers via SSH and retrieves real CPU usage, RAM usage, CPU model and core count, 2) /api/admin/servers/{id}/execute uses real SSH for command execution, 3) Frontend displays CPU model with visual progress bars for CPU/RAM. Admin credentials: admin / admin"
