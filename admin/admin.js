        // Firebase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyCvbP8QSM8cP83ETznwf867r1piXyeQru0",
            authDomain: "iniprojek-a7a86.firebaseapp.com",
            databaseURL: "https://iniprojek-a7a86-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "iniprojek-a7a86",
            storageBucket: "iniprojek-a7a86.firebasestorage.app",
            messagingSenderId: "154231706931",
            appId: "1:154231706931:web:d60b12b39664c5b04cda46"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        // Global variables
        let currentTab = 'dashboard';
        let editingVote = null;
        let editingCandidate = null;
        let actionHistory = [];
        let historyIndex = -1;
        let charts = {};
        let totalStudents = 1200;
        let realTimeListeners = {};
        let currentExportType = '';
        let selectedExportOption = 'simple';
        let candidatesData = {};

        // Initialize admin panel
        document.addEventListener('DOMContentLoaded', function() {
            // Check admin access (simple check - in production use proper authentication)
            const adminPassword = prompt('Masukkan password admin:');
            if (adminPassword !== 'kainoganteng123') {
                alert('Password salah!');
                window.location.href = 'troll.html';
                return;
            }

            initializeRealTimeListeners();
            loadDashboard();
            loadSettings();
            loadHistory();
            loadCandidatesForVoteModal();
            
            // Set default date and time for vote form
            const now = new Date();
            document.getElementById('vote-date').value = now.toISOString().split('T')[0];
            document.getElementById('vote-time').value = now.toTimeString().split(' ')[0];
            
            // Add event listeners for program preview
            document.getElementById('candidate-program-title').addEventListener('input', updateProgramPreview);
            document.getElementById('candidate-program-description').addEventListener('input', updateProgramPreview);
            
            // Set default export dates
            document.getElementById('export-start-date').value = now.toISOString().split('T')[0];
            document.getElementById('export-end-date').value = now.toISOString().split('T')[0];
        });

        // Show toast notification
        function showToast(message, type = 'success', title = 'Sukses') {
            const toast = document.getElementById('toast');
            const toastTitle = document.getElementById('toast-title');
            const toastMessage = document.getElementById('toast-message');
            const toastIcon = toast.querySelector('.toast-icon i');
            
            // Set toast content
            toastTitle.textContent = title;
            toastMessage.textContent = message;
            
            // Set toast type and icon
            toast.className = `toast ${type}`;
            toastIcon.className = type === 'success' ? 'fas fa-check-circle' :
                                 type === 'error' ? 'fas fa-exclamation-circle' :
                                 type === 'warning' ? 'fas fa-exclamation-triangle' :
                                 'fas fa-info-circle';
            
            // Show toast
            toast.classList.remove('hidden');
            toast.classList.add('show');
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.classList.add('hidden');
                }, 300);
            }, 5000);
        }

        // Update program preview
        function updateProgramPreview() {
            const title = document.getElementById('candidate-program-title').value;
            const description = document.getElementById('candidate-program-description').value;
            const preview = document.getElementById('program-preview');
            
            if (title || description) {
                document.getElementById('program-preview-title').textContent = title || 'Judul Program';
                document.getElementById('program-preview-description').textContent = description || 'Deskripsi program';
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        }

        // Initialize real-time listeners
        function initializeRealTimeListeners() {
            // Listen to votes changes
            realTimeListeners.votes = database.ref('votes').on('value', (snapshot) => {
                updateStatistics(snapshot.val());
                if (currentTab === 'votes') {
                    loadVotes();
                }
                if (currentTab === 'dashboard' || currentTab === 'analytics') {
                    loadCharts();
                }
            });

            // Listen to candidates changes
            realTimeListeners.candidates = database.ref('candidates').on('value', (snapshot) => {
                candidatesData = snapshot.val() || {};
                if (currentTab === 'candidates') {
                    loadCandidates();
                }
                if (currentTab === 'dashboard' || currentTab === 'analytics') {
                    loadCharts();
                }
                // Update candidate dropdown in vote modal
                updateCandidateDropdown();
            });

            // Listen to settings changes
            realTimeListeners.settings = database.ref('settings').on('value', (snapshot) => {
                const settings = snapshot.val();
                if (settings) {
                    totalStudents = settings.totalStudents || 1200;
                    updateStatistics();
                }
                if (currentTab === 'settings') {
                    loadSettings();
                }
            });
        }

        // Load candidates for vote modal dropdown
        async function loadCandidatesForVoteModal() {
            try {
                const candidatesSnapshot = await database.ref('candidates').once('value');
                candidatesData = candidatesSnapshot.val() || {};
                updateCandidateDropdown();
            } catch (error) {
                console.error('Error loading candidates for modal:', error);
            }
        }

        // Update candidate dropdown in vote modal
        function updateCandidateDropdown() {
            const candidateSelect = document.getElementById('vote-candidate');
            if (!candidateSelect) return;
            
            candidateSelect.innerHTML = '<option value="">Pilih Kandidat</option>';
            
            if (!candidatesData || Object.keys(candidatesData).length === 0) {
                candidateSelect.innerHTML = '<option value="">Tidak ada kandidat</option>';
                return;
            }
            
            Object.entries(candidatesData).forEach(([id, candidate]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = `${candidate.nomor} - ${candidate.nama}`;
                candidateSelect.appendChild(option);
            });
        }

        // Update statistics in real-time
        function updateStatistics(votesData = null) {
            if (!votesData) {
                database.ref('votes').once('value').then(snapshot => {
                    updateStatistics(snapshot.val());
                });
                return;
            }

            let totalVotes = 0;
            
            // Count total votes dari semua tanggal
            for (const date in votesData || {}) {
                if (votesData[date] && typeof votesData[date] === 'object') {
                    totalVotes += Object.keys(votesData[date]).length;
                }
            }
            
            const participationRate = ((totalVotes / totalStudents) * 100).toFixed(1);
            const remainingStudents = totalStudents - totalVotes;

            // Update UI
            const totalVotesEl = document.getElementById('total-votes-stat');
            const participationEl = document.getElementById('participation-stat');
            const remainingEl = document.getElementById('remaining-stat');
            const candidateCountEl = document.getElementById('candidate-count-stat');

            if (totalVotesEl) totalVotesEl.textContent = totalVotes.toLocaleString();
            if (participationEl) participationEl.textContent = participationRate + '%';
            if (remainingEl) remainingEl.textContent = remainingStudents.toLocaleString();
            if (candidateCountEl) candidateCountEl.textContent = Object.keys(candidatesData).length;
        }

        // Tab switching
        function switchTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');
            event.target.classList.add('active');
            currentTab = tabName;

            // Load tab-specific data
            switch(tabName) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'votes':
                    loadVotes();
                    break;
                case 'candidates':
                    loadCandidates();
                    break;
                case 'settings':
                    loadSettings();
                    break;
                case 'analytics':
                    loadAnalytics();
                    break;
                case 'history':
                    loadHistory();
                    break;
            }
        }

        // Load dashboard data
        async function loadDashboard() {
            try {
                await loadCharts();
            } catch (error) {
                console.error('Error loading dashboard:', error);
            }
        }

        // Load charts
        async function loadCharts() {
            try {
                const [candidatesSnapshot, votesSnapshot] = await Promise.all([
                    database.ref('candidates').once('value'),
                    database.ref('votes').once('value')
                ]);
                
                const candidates = candidatesSnapshot.val() || {};
                const votesData = votesSnapshot.val() || {};

                // Candidate votes chart
                const candidateLabels = [];
                const candidateVotes = [];
                const candidateColors = ['#1e40af', '#059669', '#7c3aed'];

                Object.values(candidates).forEach((candidate, index) => {
                    candidateLabels.push(`${candidate.nomor} - ${candidate.nama}`);
                    candidateVotes.push(candidate.votes || 0);
                });

                // Destroy existing chart if exists
                if (charts.candidateChart) {
                    charts.candidateChart.destroy();
                }

                const candidateCtx = document.getElementById('candidateChart');
                if (candidateCtx) {
                    charts.candidateChart = new Chart(candidateCtx.getContext('2d'), {
                        type: 'bar',
                        data: {
                            labels: candidateLabels,
                            datasets: [{
                                label: 'Jumlah Suara',
                                data: candidateVotes,
                                backgroundColor: candidateColors,
                                borderColor: candidateColors,
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1
                                    }
                                }
                            }
                        }
                    });
                }

                // Daily votes chart
                const dailyData = {};
                for (const date in votesData) {
                    if (votesData[date] && typeof votesData[date] === 'object') {
                        dailyData[date] = Object.keys(votesData[date]).length;
                    }
                }

                const sortedDates = Object.keys(dailyData).sort();
                const dailyLabels = sortedDates.map(date => {
                    const d = new Date(date);
                    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
                });
                const dailyVotes = sortedDates.map(date => dailyData[date]);

                if (charts.dailyChart) {
                    charts.dailyChart.destroy();
                }

                const dailyCtx = document.getElementById('dailyChart');
                if (dailyCtx) {
                    charts.dailyChart = new Chart(dailyCtx.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: dailyLabels,
                            datasets: [{
                                label: 'Suara per Hari',
                                data: dailyVotes,
                                borderColor: '#1e40af',
                                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1
                                    }
                                }
                            }
                        }
                    });
                }

                // Load analytics charts if on analytics tab
                if (currentTab === 'analytics') {
                    loadAnalyticsCharts(candidates, votesData);
                }

            } catch (error) {
                console.error('Error loading charts:', error);
            }
        }

        // Load analytics charts
        function loadAnalyticsCharts(candidates, votesData) {
            try {
                // Pie chart
                const pieLabels = [];
                const pieData = [];
                const pieColors = ['#1e40af', '#059669', '#7c3aed'];

                Object.values(candidates).forEach((candidate, index) => {
                    pieLabels.push(`${candidate.nomor} - ${candidate.nama}`);
                    pieData.push(candidate.votes || 0);
                });

                if (charts.pieChart) {
                    charts.pieChart.destroy();
                }

                const pieCtx = document.getElementById('pieChart');
                if (pieCtx) {
                    charts.pieChart = new Chart(pieCtx.getContext('2d'), {
                        type: 'pie',
                        data: {
                            labels: pieLabels,
                            datasets: [{
                                data: pieData,
                                backgroundColor: pieColors,
                                borderWidth: 2,
                                borderColor: '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom'
                                }
                            }
                        }
                    });
                }

                // Trend chart (cumulative votes over time)
                const dailyStats = {};
                for (const date in votesData) {
                    if (votesData[date] && typeof votesData[date] === 'object') {
                        dailyStats[date] = {};
                        for (const nipd in votesData[date]) {
                            const vote = votesData[date][nipd];
                            const candidateId = vote.candidateId;
                            dailyStats[date][candidateId] = (dailyStats[date][candidateId] || 0) + 1;
                        }
                    }
                }

                const sortedDates = Object.keys(dailyStats).sort();
                const trendDatasets = [];
                const candidateColors = ['#1e40af', '#059669', '#7c3aed'];

                Object.entries(candidates).forEach(([id, candidate], index) => {
                    let cumulativeVotes = 0;
                    const data = sortedDates.map(date => {
                        cumulativeVotes += dailyStats[date][id] || 0;
                        return cumulativeVotes;
                    });

                    trendDatasets.push({
                        label: `${candidate.nomor} - ${candidate.nama}`,
                        data: data,
                        borderColor: candidateColors[index],
                        backgroundColor: candidateColors[index] + '20',
                        tension: 0.4,
                        fill: false
                    });
                });

                if (charts.trendChart) {
                    charts.trendChart.destroy();
                }

                const trendCtx = document.getElementById('trendChart');
                if (trendCtx) {
                    charts.trendChart = new Chart(trendCtx.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: sortedDates.map(date => {
                                const d = new Date(date);
                                return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
                            }),
                            datasets: trendDatasets
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    position: 'bottom'
                                }
                            }
                        }
                    });
                }

                // Daily stats table
                const tableBody = document.getElementById('daily-stats-table');
                if (tableBody) {
                    tableBody.innerHTML = '';

                    if (sortedDates.length === 0) {
                        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">Belum ada data</td></tr>';
                        return;
                    }

                    sortedDates.forEach(date => {
                        const stats = dailyStats[date];
                        const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
                        
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${new Date(date).toLocaleDateString('id-ID')}</td>
                            <td><strong>${total}</strong></td>
                            <td>${stats['1'] || 0}</td>
                            <td>${stats['2'] || 0}</td>
                            <td>${stats['3'] || 0}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                }

            } catch (error) {
                console.error('Error loading analytics charts:', error);
            }
        }

        // Load votes data
        async function loadVotes() {
            try {
                const [votesSnapshot, candidatesSnapshot] = await Promise.all([
                    database.ref('votes').once('value'),
                    database.ref('candidates').once('value')
                ]);
                
                const votesData = votesSnapshot.val() || {};
                const candidates = candidatesSnapshot.val() || {};

                const tbody = document.getElementById('votes-table-body');
                const dateFilter = document.getElementById('date-filter');
                
                if (!tbody || !dateFilter) return;
                
                // Clear existing data
                tbody.innerHTML = '';
                dateFilter.innerHTML = '<option value="">Semua Tanggal</option>';

                // Populate date filter
                const dates = Object.keys(votesData).sort().reverse();
                dates.forEach(date => {
                    const option = document.createElement('option');
                    option.value = date;
                    option.textContent = new Date(date).toLocaleDateString('id-ID');
                    dateFilter.appendChild(option);
                });

                // Populate votes table
                let allVotes = [];
                for (const date in votesData) {
                    if (votesData[date] && typeof votesData[date] === 'object') {
                        for (const nipd in votesData[date]) {
                            const vote = votesData[date][nipd];
                            const candidate = candidates[vote.candidateId];
                            allVotes.push({
                                ...vote,
                                date: date,
                                candidateName: candidate ? `${candidate.nomor} - ${candidate.nama}` : 'Unknown',
                                candidateId: vote.candidateId
                            });
                        }
                    }
                }

                // Sort by date and time (newest first)
                allVotes.sort((a, b) => {
                    const dateTimeA = new Date(a.date + ' ' + a.time);
                    const dateTimeB = new Date(b.date + ' ' + b.time);
                    return dateTimeB - dateTimeA;
                });

                if (allVotes.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b;">Belum ada data suara</td></tr>';
                    return;
                }

                allVotes.forEach(vote => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${vote.nipd}</td>
                        <td>${vote.candidateName}</td>
                        <td>${new Date(vote.date).toLocaleDateString('id-ID')}</td>
                        <td>${vote.time}</td>
                        <td>
                            <button class="btn btn-sm btn-warning" onclick="editVote('${vote.date}', '${vote.nipd}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteVote('${vote.date}', '${vote.nipd}')">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });

            } catch (error) {
                console.error('Error loading votes:', error);
                const tbody = document.getElementById('votes-table-body');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #dc2626;">Error loading data</td></tr>';
                }
            }
        }

        // Filter votes by date
        function filterVotesByDate() {
            const selectedDate = document.getElementById('date-filter').value;
            const rows = document.querySelectorAll('#votes-table-body tr');
            
            rows.forEach(row => {
                if (!selectedDate) {
                    row.style.display = '';
                } else {
                    const dateCell = row.cells[2];
                    if (dateCell) {
                        const cellText = dateCell.textContent;
                        const dateParts = cellText.split('/');
                        if (dateParts.length === 3) {
                            const rowDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
                            row.style.display = rowDate === selectedDate ? '' : 'none';
                        }
                    }
                }
            });
        }

        // Load candidates
        async function loadCandidates() {
            try {
                const candidatesSnapshot = await database.ref('candidates').once('value');
                const candidates = candidatesSnapshot.val() || {};
                
                const grid = document.getElementById('candidates-grid');
                if (!grid) return;
                
                grid.innerHTML = '';

                if (Object.keys(candidates).length === 0) {
                    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--gray-500);">Belum ada kandidat</div>';
                    return;
                }

                Object.entries(candidates).forEach(([id, candidate]) => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    
                    // Check if program is in new format (object) or old format (array)
                    let programTitle = 'Program Unggulan';
                    let programDescription = 'Deskripsi program belum tersedia';
                    
                    if (candidate.program) {
                        if (typeof candidate.program === 'object' && candidate.program.judul) {
                            // New format
                            programTitle = candidate.program.judul;
                            programDescription = candidate.program.deskripsi;
                        } else if (Array.isArray(candidate.program) && candidate.program.length > 0) {
                            // Old format - convert to new format
                            programTitle = candidate.program[0] || programTitle;
                            programDescription = candidate.program.length > 1 ? candidate.program.slice(1).join(' ') : programDescription;
                        }
                    }
                    
                    card.innerHTML = `
                        <div class="card-header">
                            <div class="card-title">${candidate.nomor} - ${candidate.nama}</div>
                            <div class="card-description">${candidate.kelas} | ${candidate.votes || 0} suara</div>
                        </div>
                        <div class="card-content">
                            <div class="program-preview">
                                <div class="program-title">${programTitle}</div>
                                <div class="program-description">${programDescription}</div>
                            </div>
                            <div style="margin-top: 1rem;">
                                <strong>Visi:</strong>
                                <p style="font-size: 0.875rem; color: var(--gray-600); margin-top: 0.25rem;">
                                    ${candidate.visi ? candidate.visi.substring(0, 100) + '...' : 'Visi belum tersedia'}
                                </p>
                            </div>
                            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                                <button class="btn btn-primary btn-sm" onclick="editCandidate('${id}')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="deleteCandidate('${id}')">
                                    <i class="fas fa-trash"></i> Hapus
                                </button>
                            </div>
                        </div>
                    `;
                    grid.appendChild(card);
                });

            } catch (error) {
                console.error('Error loading candidates:', error);
            }
        }

        // Load settings
        async function loadSettings() {
            try {
                const settingsSnapshot = await database.ref('settings').once('value');
                const settings = settingsSnapshot.val() || {};
                
                const totalStudentsEl = document.getElementById('total-students');
                const votingStatusEl = document.getElementById('voting-status');
                const startDateEl = document.getElementById('start-date');
                const endDateEl = document.getElementById('end-date');
                
                if (totalStudentsEl) totalStudentsEl.value = settings.totalStudents || 1200;
                if (votingStatusEl) votingStatusEl.value = settings.votingOpen !== false ? 'true' : 'false';
                if (startDateEl) startDateEl.value = settings.startDate || '';
                if (endDateEl) endDateEl.value = settings.endDate || '';

            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }

        // Load analytics
        async function loadAnalytics() {
            try {
                const [candidatesSnapshot, votesSnapshot] = await Promise.all([
                    database.ref('candidates').once('value'),
                    database.ref('votes').once('value')
                ]);
                
                const candidates = candidatesSnapshot.val() || {};
                const votesData = votesSnapshot.val() || {};

                loadAnalyticsCharts(candidates, votesData);

            } catch (error) {
                console.error('Error loading analytics:', error);
            }
        }

        // Load history
        function loadHistory() {
            const historyList = document.getElementById('history-list');
            if (!historyList) return;
            
            historyList.innerHTML = '';

            if (actionHistory.length === 0) {
                historyList.innerHTML = '<p style="text-align: center; color: var(--gray-500);">Belum ada riwayat aksi</p>';
                return;
            }

            actionHistory.forEach((action, index) => {
                const item = document.createElement('div');
                item.className = `history-item ${index > historyIndex ? 'undone' : ''}`;
                item.innerHTML = `
                    <div class="history-action">
                        <span>${getActionIcon(action.type)}</span>
                        <span>${action.description}</span>
                    </div>
                    <div class="history-time">${action.timestamp}</div>
                `;
                historyList.appendChild(item);
            });

            // Update undo/redo buttons
            const undoBtn = document.getElementById('undo-btn');
            const redoBtn = document.getElementById('redo-btn');
            
            if (undoBtn) undoBtn.disabled = historyIndex < 0;
            if (redoBtn) redoBtn.disabled = historyIndex >= actionHistory.length - 1;
        }

        // Get action icon
        function getActionIcon(type) {
            const icons = {
                'add_vote': '➕',
                'edit_vote': '✏️',
                'delete_vote': '🗑️',
                'add_candidate': '👤',
                'edit_candidate': '👤',
                'delete_candidate': '👤',
                'edit_settings': '⚙️',
                'reset_votes': '🔄',
                'reset_all': '💥'
            };
            return icons[type] || '📝';
        }

        // Add action to history
        function addToHistory(type, description, undoFunction, redoFunction) {
            // Remove any actions after current index
            actionHistory = actionHistory.slice(0, historyIndex + 1);
            
            // Add new action
            actionHistory.push({
                type: type,
                description: description,
                timestamp: new Date().toLocaleString('id-ID'),
                undo: undoFunction,
                redo: redoFunction
            });
            
            historyIndex = actionHistory.length - 1;
            
            // Keep only last 50 actions
            if (actionHistory.length > 50) {
                actionHistory = actionHistory.slice(-50);
                historyIndex = actionHistory.length - 1;
            }
            
            if (currentTab === 'history') {
                loadHistory();
            }
        }

        // Undo last action
        async function undoLastAction() {
            if (historyIndex >= 0) {
                const action = actionHistory[historyIndex];
                if (action.undo) {
                    await action.undo();
                    historyIndex--;
                    loadHistory();
                    showToast('Aksi berhasil dibatalkan', 'success', 'Undo Berhasil');
                }
            }
        }

        // Redo last action
        async function redoLastAction() {
            if (historyIndex < actionHistory.length - 1) {
                historyIndex++;
                const action = actionHistory[historyIndex];
                if (action.redo) {
                    await action.redo();
                    loadHistory();
                    showToast('Aksi berhasil diulang', 'success', 'Redo Berhasil');
                }
            }
        }

        // Show add vote modal
        function showAddVoteModal() {
            editingVote = null;
            const modalTitle = document.getElementById('vote-modal-title');
            const voteForm = document.getElementById('vote-form');
            
            if (modalTitle) modalTitle.textContent = 'Tambah Suara';
            if (voteForm) voteForm.reset();
            
            // Set default values
            const now = new Date();
            const dateEl = document.getElementById('vote-date');
            const timeEl = document.getElementById('vote-time');
            
            if (dateEl) dateEl.value = now.toISOString().split('T')[0];
            if (timeEl) timeEl.value = now.toTimeString().split(' ')[0];
            
            document.getElementById('vote-modal').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('vote-modal').classList.add('active');
            }, 10);
        }

        // Edit vote
        async function editVote(date, nipd) {
            try {
                const voteSnapshot = await database.ref(`votes/${date}/${nipd}`).once('value');
                const vote = voteSnapshot.val();
                
                if (!vote) {
                    alert('Data suara tidak ditemukan!');
                    return;
                }

                editingVote = { date, nipd, originalData: vote };
                
                const modalTitle = document.getElementById('vote-modal-title');
                if (modalTitle) modalTitle.textContent = 'Edit Suara';
                
                const nipdEl = document.getElementById('vote-nipd');
                const candidateEl = document.getElementById('vote-candidate');
                const dateEl = document.getElementById('vote-date');
                const timeEl = document.getElementById('vote-time');
                
                if (nipdEl) nipdEl.value = vote.nipd;
                if (candidateEl) candidateEl.value = vote.candidateId;
                if (dateEl) dateEl.value = date;
                if (timeEl) timeEl.value = vote.time;
                
                document.getElementById('vote-modal').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('vote-modal').classList.add('active');
                }, 10);

            } catch (error) {
                console.error('Error loading vote for edit:', error);
                alert('Error loading data!');
            }
        }

        // Save vote (add or edit)
        async function saveVote() {
            try {
                const nipd = document.getElementById('vote-nipd').value;
                const candidateId = document.getElementById('vote-candidate').value;
                const date = document.getElementById('vote-date').value;
                const time = document.getElementById('vote-time').value;

                if (!nipd || !candidateId || !date || !time) {
                    showToast('Semua field harus diisi!', 'error', 'Error Validasi');
                    return;
                }

                // Validasi NIPD
                if (nipd.length < 8 || nipd.length > 12) {
                    showToast('NIPD/NIS harus antara 8-12 digit!', 'error', 'Error Validasi');
                    return;
                }

                const voteData = {
                    nipd: nipd,
                    candidateId: candidateId,
                    time: time,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };

                if (editingVote) {
                    // Edit existing vote
                    const oldData = editingVote.originalData;
                    
                    // Remove from old location if date or nipd changed
                    if (editingVote.date !== date || editingVote.nipd !== nipd) {
                        await database.ref(`votes/${editingVote.date}/${editingVote.nipd}`).remove();
                        
                        // Update old candidate count
                        await database.ref(`candidates/${oldData.candidateId}/votes`).transaction((votes) => {
                            return Math.max(0, (votes || 0) - 1);
                        });
                    }
                    
                    // Save to new location
                    await database.ref(`votes/${date}/${nipd}`).set(voteData);
                    
                    // Update candidate counts if candidate changed
                    if (oldData.candidateId !== candidateId) {
                        // Decrease old candidate (if not already decreased above)
                        if (editingVote.date === date && editingVote.nipd === nipd) {
                            await database.ref(`candidates/${oldData.candidateId}/votes`).transaction((votes) => {
                                return Math.max(0, (votes || 0) - 1);
                            });
                        }
                        
                        // Increase new candidate
                        await database.ref(`candidates/${candidateId}/votes`).transaction((votes) => {
                            return (votes || 0) + 1;
                        });
                    } else if (editingVote.date === date && editingVote.nipd === nipd) {
                        // Same candidate, same location - no count change needed
                    } else {
                        // Different location, same candidate - add count
                        await database.ref(`candidates/${candidateId}/votes`).transaction((votes) => {
                            return (votes || 0) + 1;
                        });
                    }

                    addToHistory('edit_vote', `Edit suara ${nipd}`, 
                        async () => {
                            // Undo: restore original data
                            await database.ref(`votes/${date}/${nipd}`).remove();
                            await database.ref(`votes/${editingVote.date}/${editingVote.nipd}`).set(oldData);
                            
                            // Restore candidate counts
                            await database.ref(`candidates/${candidateId}/votes`).transaction((votes) => {
                                return Math.max(0, (votes || 0) - 1);
                            });
                            await database.ref(`candidates/${oldData.candidateId}/votes`).transaction((votes) => {
                                return (votes || 0) + 1;
                            });
                        },
                        async () => {
                            // Redo: apply changes again
                            await database.ref(`votes/${editingVote.date}/${editingVote.nipd}`).remove();
                            await database.ref(`votes/${date}/${nipd}`).set(voteData);
                            
                            await database.ref(`candidates/${oldData.candidateId}/votes`).transaction((votes) => {
                                return Math.max(0, (votes || 0) - 1);
                            });
                            await database.ref(`candidates/${candidateId}/votes`).transaction((votes) => {
                                return (votes || 0) + 1;
                            });
                        }
                    );

                    showToast('Data suara berhasil diperbarui!', 'success');

                } else {
                    // Check if NIPD already exists
                    const existingVoteSnapshot = await database.ref(`votes/${date}/${nipd}`).once('value');
                    if (existingVoteSnapshot.exists()) {
                        showToast('NIPD/NIS sudah memiliki suara pada tanggal ini!', 'error', 'Error Duplikasi');
                        return;
                    }

                    // Add new vote
                    await database.ref(`votes/${date}/${nipd}`).set(voteData);
                    
                    // Update candidate count
                    await database.ref(`candidates/${candidateId}/votes`).transaction((votes) => {
                        return (votes || 0) + 1;
                    });

                    addToHistory('add_vote', `Tambah suara ${nipd}`,
                        async () => {
                            // Undo: remove vote
                            await database.ref(`votes/${date}/${nipd}`).remove();
                            await database.ref(`candidates/${candidateId}/votes`).transaction((votes) => {
                                return Math.max(0, (votes || 0) - 1);
                            });
                        },
                        async () => {
                            // Redo: add vote back
                            await database.ref(`votes/${date}/${nipd}`).set(voteData);
                            await database.ref(`candidates/${candidateId}/votes`).transaction((votes) => {
                                return (votes || 0) + 1;
                            });
                        }
                    );

                    showToast('Data suara berhasil ditambahkan!', 'success');
                }

                closeVoteModal();

            } catch (error) {
                console.error('Error saving vote:', error);
                showToast('Error menyimpan data!', 'error', 'Error Sistem');
            }
        }

        // Delete vote
        async function deleteVote(date, nipd) {
            if (!confirm('Yakin ingin menghapus suara ini?')) {
                return;
            }

            try {
                const voteSnapshot = await database.ref(`votes/${date}/${nipd}`).once('value');
                const voteData = voteSnapshot.val();
                
                if (!voteData) {
                    showToast('Data tidak ditemukan!', 'error', 'Error Data');
                    return;
                }

                // Remove vote
                await database.ref(`votes/${date}/${nipd}`).remove();
                
                // Update candidate count
                await database.ref(`candidates/${voteData.candidateId}/votes`).transaction((votes) => {
                    return Math.max(0, (votes || 0) - 1);
                });

                addToHistory('delete_vote', `Hapus suara ${nipd}`,
                    async () => {
                        // Undo: restore vote
                        await database.ref(`votes/${date}/${nipd}`).set(voteData);
                        await database.ref(`candidates/${voteData.candidateId}/votes`).transaction((votes) => {
                            return (votes || 0) + 1;
                        });
                    },
                    async () => {
                        // Redo: delete again
                        await database.ref(`votes/${date}/${nipd}`).remove();
                        await database.ref(`candidates/${voteData.candidateId}/votes`).transaction((votes) => {
                            return Math.max(0, (votes || 0) - 1);
                        });
                    }
                );

                showToast('Data suara berhasil dihapus!', 'success');

            } catch (error) {
                console.error('Error deleting vote:', error);
                showToast('Error menghapus data!', 'error', 'Error Sistem');
            }
        }

        // Close vote modal
        function closeVoteModal() {
            document.getElementById('vote-modal').classList.remove('active');
            setTimeout(() => {
                document.getElementById('vote-modal').classList.add('hidden');
            }, 300);
            editingVote = null;
        }

        // Show add candidate modal
        function showAddCandidateModal() {
            editingCandidate = null;
            const modalTitle = document.getElementById('candidate-modal-title');
            const candidateForm = document.getElementById('candidate-form');
            
            if (modalTitle) modalTitle.textContent = 'Tambah Kandidat';
            if (candidateForm) candidateForm.reset();
            
            // Reset program preview
            document.getElementById('program-preview').style.display = 'none';
            
            document.getElementById('candidate-modal').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('candidate-modal').classList.add('active');
            }, 10);
        }

        // Edit candidate
        async function editCandidate(candidateId) {
            try {
                const candidateSnapshot = await database.ref(`candidates/${candidateId}`).once('value');
                const candidate = candidateSnapshot.val();
                
                if (!candidate) {
                    showToast('Data kandidat tidak ditemukan!', 'error', 'Error Data');
                    return;
                }

                editingCandidate = { id: candidateId, originalData: candidate };
                
                const modalTitle = document.getElementById('candidate-modal-title');
                if (modalTitle) modalTitle.textContent = 'Edit Kandidat';
                
                const numberEl = document.getElementById('candidate-number');
                const nameEl = document.getElementById('candidate-name');
                const classEl = document.getElementById('candidate-class');
                const visiEl = document.getElementById('candidate-visi');
                const misiEl = document.getElementById('candidate-misi');
                const programTitleEl = document.getElementById('candidate-program-title');
                const programDescEl = document.getElementById('candidate-program-description');
                const jargonEl = document.getElementById('candidate-jargon');
                const taglineEl = document.getElementById('candidate-tagline');
                
                if (numberEl) numberEl.value = candidate.nomor;
                if (nameEl) nameEl.value = candidate.nama;
                if (classEl) classEl.value = candidate.kelas;
                if (visiEl) visiEl.value = candidate.visi;
                if (misiEl) misiEl.value = Array.isArray(candidate.misi) ? candidate.misi.join('\n') : '';
                if (jargonEl) jargonEl.value = candidate.jargon || '';
                if (taglineEl) taglineEl.value = candidate.tagline || '';
                
                // Handle program data (both old and new format)
                let programTitle = 'Program Unggulan';
                let programDescription = 'Deskripsi program';
                
                if (candidate.program) {
                    if (typeof candidate.program === 'object' && candidate.program.judul) {
                        // New format
                        programTitle = candidate.program.judul;
                        programDescription = candidate.program.deskripsi;
                    } else if (Array.isArray(candidate.program) && candidate.program.length > 0) {
                        // Old format - convert to new format
                        programTitle = candidate.program[0] || programTitle;
                        programDescription = candidate.program.length > 1 ? candidate.program.slice(1).join(' ') : programDescription;
                    }
                }
                
                if (programTitleEl) programTitleEl.value = programTitle;
                if (programDescEl) programDescEl.value = programDescription;
                
                // Update program preview
                updateProgramPreview();
                
                document.getElementById('candidate-modal').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('candidate-modal').classList.add('active');
                }, 10);

            } catch (error) {
                console.error('Error loading candidate for edit:', error);
                showToast('Error loading data!', 'error', 'Error Sistem');
            }
        }

        // Save candidate
        async function saveCandidate() {
            try {
                const nomor = document.getElementById('candidate-number').value;
                const nama = document.getElementById('candidate-name').value;
                const kelas = document.getElementById('candidate-class').value;
                const visi = document.getElementById('candidate-visi').value;
                const misi = document.getElementById('candidate-misi').value.split('\n').filter(m => m.trim());
                const programTitle = document.getElementById('candidate-program-title').value;
                const programDescription = document.getElementById('candidate-program-description').value;
                const jargon = document.getElementById('candidate-jargon').value;
                const tagline = document.getElementById('candidate-tagline').value;

                if (!nomor || !nama || !kelas || !visi || misi.length === 0 || !programTitle || !programDescription || !jargon || !tagline) {
                    showToast('Semua field harus diisi!', 'error', 'Error Validasi');
                    return;
                }

                // Validasi nomor urut
                if (nomor < 1 || nomor > 99) {
                    showToast('Nomor urut harus antara 1-99!', 'error', 'Error Validasi');
                    return;
                }

                // Show loading state
                const saveBtn = document.getElementById('save-candidate-btn');
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<div class="spinner"></div> Menyimpan...';
                saveBtn.disabled = true;

                const candidateData = {
                    nomor: nomor,
                    nama: nama,
                    kelas: kelas,
                    visi: visi,
                    misi: misi,
                    program: {
                        judul: programTitle,
                        deskripsi: programDescription
                    },
                    jargon: jargon,
                    tagline: tagline,
                    votes: editingCandidate ? editingCandidate.originalData.votes || 0 : 0
                };

                if (editingCandidate) {
                    // Edit existing candidate
                    await database.ref(`candidates/${editingCandidate.id}`).set(candidateData);

                    addToHistory('edit_candidate', `Edit kandidat ${nama}`,
                        async () => {
                            // Undo: restore original data
                            await database.ref(`candidates/${editingCandidate.id}`).set(editingCandidate.originalData);
                        },
                        async () => {
                            // Redo: apply changes again
                            await database.ref(`candidates/${editingCandidate.id}`).set(candidateData);
                        }
                    );

                    showToast('Data kandidat berhasil diperbarui!', 'success');

                } else {
                    // Check if candidate number already exists
                    const candidatesSnapshot = await database.ref('candidates').once('value');
                    const candidates = candidatesSnapshot.val() || {};
                    const existingCandidate = Object.values(candidates).find(c => c.nomor == nomor);
                    
                    if (existingCandidate) {
                        showToast(`Nomor ${nomor} sudah digunakan oleh kandidat lain!`, 'error', 'Error Duplikasi');
                        // Restore button state
                        saveBtn.innerHTML = originalText;
                        saveBtn.disabled = false;
                        return;
                    }

                    // Add new candidate
                    const newCandidateRef = database.ref('candidates').push();
                    await newCandidateRef.set(candidateData);

                    addToHistory('add_candidate', `Tambah kandidat ${nama}`,
                        async () => {
                            // Undo: remove candidate
                            await newCandidateRef.remove();
                        },
                        async () => {
                            // Redo: add candidate back
                            await newCandidateRef.set(candidateData);
                        }
                    );

                    showToast('Data kandidat berhasil ditambahkan!', 'success');
                }

                // Restore button state
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;

                closeCandidateModal();

            } catch (error) {
                console.error('Error saving candidate:', error);
                showToast('Error menyimpan data!', 'error', 'Error Sistem');
                
                // Restore button state on error
                const saveBtn = document.getElementById('save-candidate-btn');
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
                saveBtn.disabled = false;
            }
        }

        // Delete candidate
        async function deleteCandidate(candidateId) {
            if (!confirm('Yakin ingin menghapus kandidat ini? Semua suara untuk kandidat ini juga akan dihapus.')) {
                return;
            }

            if (!confirm('Konfirmasi sekali lagi: Data kandidat dan semua suaranya akan dihapus permanen!')) {
                return;
            }

            try {
                const candidateSnapshot = await database.ref(`candidates/${candidateId}`).once('value');
                const candidateData = candidateSnapshot.val();
                
                if (!candidateData) {
                    showToast('Data tidak ditemukan!', 'error', 'Error Data');
                    return;
                }

                // Remove candidate
                await database.ref(`candidates/${candidateId}`).remove();
                
                // Remove all votes for this candidate
                const votesSnapshot = await database.ref('votes').once('value');
                const votesData = votesSnapshot.val() || {};
                
                for (const date in votesData) {
                    if (votesData[date] && typeof votesData[date] === 'object') {
                        for (const nipd in votesData[date]) {
                            if (votesData[date][nipd].candidateId === candidateId) {
                                await database.ref(`votes/${date}/${nipd}`).remove();
                            }
                        }
                    }
                }

                addToHistory('delete_candidate', `Hapus kandidat ${candidateData.nama}`,
                    async () => {
                        // Undo: restore candidate and votes
                        await database.ref(`candidates/${candidateId}`).set(candidateData);
                        
                        // Note: Restoring votes would be complex, so we'll just restore the candidate
                    },
                    async () => {
                        // Redo: delete again
                        await database.ref(`candidates/${candidateId}`).remove();
                    }
                );

                showToast('Kandidat berhasil dihapus!', 'success');

            } catch (error) {
                console.error('Error deleting candidate:', error);
                showToast('Error menghapus data!', 'error', 'Error Sistem');
            }
        }

        // Close candidate modal
        function closeCandidateModal() {
            document.getElementById('candidate-modal').classList.remove('active');
            setTimeout(() => {
                document.getElementById('candidate-modal').classList.add('hidden');
            }, 300);
            editingCandidate = null;
        }

        // Save settings
        document.getElementById('settings-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const totalStudentsEl = document.getElementById('total-students');
                const votingStatusEl = document.getElementById('voting-status');
                const startDateEl = document.getElementById('start-date');
                const endDateEl = document.getElementById('end-date');
                
                const totalStudentsValue = parseInt(totalStudentsEl.value);
                const votingOpen = votingStatusEl.value === 'true';
                const startDate = startDateEl.value;
                const endDate = endDateEl.value;

                if (totalStudentsValue < 1) {
                    showToast('Total siswa harus lebih dari 0!', 'error', 'Error Validasi');
                    return;
                }

                if (startDate && endDate && startDate > endDate) {
                    showToast('Tanggal mulai tidak boleh lebih besar dari tanggal berakhir!', 'error', 'Error Validasi');
                    return;
                }

                const oldSettingsSnapshot = await database.ref('settings').once('value');
                const oldSettings = oldSettingsSnapshot.val() || {};

                const newSettings = {
                    totalStudents: totalStudentsValue,
                    votingOpen: votingOpen,
                    startDate: startDate,
                    endDate: endDate,
                    lastUpdated: firebase.database.ServerValue.TIMESTAMP
                };

                await database.ref('settings').set(newSettings);

                addToHistory('edit_settings', `Update pengaturan sistem`,
                    async () => {
                        // Undo: restore old settings
                        await database.ref('settings').set(oldSettings);
                    },
                    async () => {
                        // Redo: apply new settings
                        await database.ref('settings').set(newSettings);
                    }
                );

                showToast('Pengaturan berhasil disimpan!', 'success');

            } catch (error) {
                console.error('Error saving settings:', error);
                showToast('Error menyimpan pengaturan!', 'error', 'Error Sistem');
            }
        });

        // Reset votes
        async function resetVotes() {
            if (!confirm('Yakin ingin menghapus SEMUA data suara? Aksi ini tidak dapat dibatalkan!')) {
                return;
            }

            if (!confirm('Konfirmasi sekali lagi: SEMUA DATA SUARA AKAN HILANG!')) {
                return;
            }

            try {
                // Backup current data
                const votesSnapshot = await database.ref('votes').once('value');
                const candidatesSnapshot = await database.ref('candidates').once('value');
                const backupVotes = votesSnapshot.val();
                const backupCandidates = candidatesSnapshot.val();

                // Reset votes
                await database.ref('votes').remove();
                
                // Reset candidate vote counts
                const candidates = candidatesSnapshot.val() || {};
                for (const id in candidates) {
                    await database.ref(`candidates/${id}/votes`).set(0);
                }

                addToHistory('reset_votes', `Reset semua data suara`,
                    async () => {
                        // Undo: restore all data
                        if (backupVotes) {
                            await database.ref('votes').set(backupVotes);
                        }
                        if (backupCandidates) {
                            await database.ref('candidates').set(backupCandidates);
                        }
                    },
                    async () => {
                        // Redo: reset again
                        await database.ref('votes').remove();
                        for (const id in candidates) {
                            await database.ref(`candidates/${id}/votes`).set(0);
                        }
                    }
                );

                showToast('Semua data suara berhasil dihapus!', 'success');

            } catch (error) {
                console.error('Error resetting votes:', error);
                showToast('Error menghapus data!', 'error', 'Error Sistem');
            }
        }

        // Reset all data
        async function resetAll() {
            if (!confirm('Yakin ingin menghapus SEMUA data termasuk kandidat dan pengaturan? Aksi ini tidak dapat dibatalkan!')) {
                return;
            }

            if (!confirm('Konfirmasi sekali lagi: SEMUA DATA AKAN HILANG!')) {
                return;
            }

            try {
                // Backup all data
                const allDataSnapshot = await database.ref().once('value');
                const backupData = allDataSnapshot.val();

                // Reset everything
                await database.ref().remove();

                addToHistory('reset_all', `Reset semua data sistem`,
                    async () => {
                        // Undo: restore all data
                        if (backupData) {
                            await database.ref().set(backupData);
                        }
                    },
                    async () => {
                        // Redo: reset all again
                        await database.ref().remove();
                    }
                );

                showToast('Semua data berhasil dihapus! Halaman akan dimuat ulang.', 'success');
                setTimeout(() => {
                    location.reload();
                }, 2000);

            } catch (error) {
                console.error('Error resetting all data:', error);
                showToast('Error menghapus data!', 'error', 'Error Sistem');
            }
        }

        // Show export modal
        function showExportModal(type) {
            currentExportType = type;
            document.getElementById('export-modal').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('export-modal').classList.add('active');
            }, 10);
        }

        // Select export option
        function selectExportOption(option) {
            selectedExportOption = option;
            
            // Remove selected class from all options
            document.querySelectorAll('.export-option').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            event.currentTarget.classList.add('selected');
        }

        // Close export modal
        function closeExportModal() {
            document.getElementById('export-modal').classList.remove('active');
            setTimeout(() => {
                document.getElementById('export-modal').classList.add('hidden');
            }, 300);
        }

        // Confirm export
        async function confirmExport() {
            try {
                switch(currentExportType) {
                    case 'votes':
                        await exportVotesToExcel();
                        break;
                    case 'candidates':
                        await exportCandidatesToExcel();
                        break;
                    case 'history':
                        await exportHistoryToExcel();
                        break;
                    case 'all':
                        await exportAllDataToExcel();
                        break;
                }
                
                closeExportModal();
            } catch (error) {
                console.error('Error exporting data:', error);
                showToast('Error saat export data!', 'error', 'Error Sistem');
            }
        }

        // Export votes to Excel
        async function exportVotesToExcel() {
            try {
                const [votesSnapshot, candidatesSnapshot] = await Promise.all([
                    database.ref('votes').once('value'),
                    database.ref('candidates').once('value')
                ]);
                
                const votesData = votesSnapshot.val() || {};
                const candidates = candidatesSnapshot.val() || {};

                // Collect all votes data
                let allVotes = [];
                for (const date in votesData) {
                    if (votesData[date] && typeof votesData[date] === 'object') {
                        for (const nipd in votesData[date]) {
                            const vote = votesData[date][nipd];
                            const candidate = candidates[vote.candidateId];
                            allVotes.push({
                                'NIPD/NIS': nipd,
                                'Kandidat': candidate ? `${candidate.nomor} - ${candidate.nama}` : 'Unknown',
                                'Tanggal': new Date(date).toLocaleDateString('id-ID'),
                                'Waktu': vote.time
                            });
                        }
                    }
                }

                // Create CSV content
                let csvContent = '';
                
                if (selectedExportOption === 'detailed') {
                    // Header dengan format yang lebih rapih
                    csvContent = '"LAPORAN DATA SUARA PEMILU OSIS"\n\n';
                    csvContent += '"Tanggal Export","' + new Date().toLocaleDateString('id-ID') + '"\n';
                    csvContent += '"Total Data","' + allVotes.length + '"\n\n';
                    
                    // Header tabel
                    csvContent += '"No","NIPD/NIS","Kandidat","Tanggal","Waktu"\n';
                    
                    // Data
                    allVotes.forEach((vote, index) => {
                        csvContent += `"${index + 1}","${vote['NIPD/NIS']}","${vote['Kandidat']}","${vote['Tanggal']}","${vote['Waktu']}"\n`;
                    });
                } else {
                    // Format sederhana
                    csvContent = '"NIPD/NIS","Kandidat","Tanggal","Waktu"\n';
                    
                    allVotes.forEach(vote => {
                        csvContent += `"${vote['NIPD/NIS']}","${vote['Kandidat']}","${vote['Tanggal']}","${vote['Waktu']}"\n`;
                    });
                }

                // Create and download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `data_suara_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                addToHistory('export', 'Export data suara ke Excel', null, null);
                showToast('Data suara berhasil di-export!', 'success');

            } catch (error) {
                console.error('Error exporting votes:', error);
                showToast('Error saat export data suara!', 'error', 'Error Sistem');
            }
        }

        // Export candidates to Excel
        async function exportCandidatesToExcel() {
            try {
                const candidatesSnapshot = await database.ref('candidates').once('value');
                const candidates = candidatesSnapshot.val() || {};

                // Collect all candidates data
                let allCandidates = [];
                Object.values(candidates).forEach(candidate => {
                    let programText = '';
                    if (candidate.program) {
                        if (typeof candidate.program === 'object' && candidate.program.judul) {
                            programText = `${candidate.program.judul}: ${candidate.program.deskripsi}`;
                        } else if (Array.isArray(candidate.program)) {
                            programText = candidate.program.join(', ');
                        }
                    }

                    allCandidates.push({
                        'Nomor': candidate.nomor,
                        'Nama': candidate.nama,
                        'Kelas': candidate.kelas,
                        'Visi': candidate.visi,
                        'Misi': Array.isArray(candidate.misi) ? candidate.misi.join('; ') : candidate.misi,
                        'Program': programText,
                        'Jargon': candidate.jargon || '',
                        'Tagline': candidate.tagline || '',
                        'Jumlah Suara': candidate.votes || 0
                    });
                });

                // Create CSV content
                let csvContent = '';
                
                if (selectedExportOption === 'detailed') {
                    // Header dengan format yang lebih rapih
                    csvContent = '"LAPORAN DATA KANDIDAT PEMILU OSIS"\n\n';
                    csvContent += '"Tanggal Export","' + new Date().toLocaleDateString('id-ID') + '"\n';
                    csvContent += '"Total Kandidat","' + allCandidates.length + '"\n\n';
                    
                    // Header tabel
                    csvContent += '"No","Nomor","Nama","Kelas","Visi","Misi","Program","Jargon","Tagline","Jumlah Suara"\n';
                    
                    // Data
                    allCandidates.forEach((candidate, index) => {
                        csvContent += `"${index + 1}","${candidate['Nomor']}","${candidate['Nama']}","${candidate['Kelas']}","${candidate['Visi']}","${candidate['Misi']}","${candidate['Program']}","${candidate['Jargon']}","${candidate['Tagline']}","${candidate['Jumlah Suara']}"\n`;
                    });
                } else {
                    // Format sederhana
                    csvContent = '"Nomor","Nama","Kelas","Visi","Misi","Program","Jargon","Tagline","Jumlah Suara"\n';
                    
                    allCandidates.forEach(candidate => {
                        csvContent += `"${candidate['Nomor']}","${candidate['Nama']}","${candidate['Kelas']}","${candidate['Visi']}","${candidate['Misi']}","${candidate['Program']}","${candidate['Jargon']}","${candidate['Tagline']}","${candidate['Jumlah Suara']}"\n`;
                    });
                }

                // Create and download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `data_kandidat_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                addToHistory('export', 'Export data kandidat ke Excel', null, null);
                showToast('Data kandidat berhasil di-export!', 'success');

            } catch (error) {
                console.error('Error exporting candidates:', error);
                showToast('Error saat export data kandidat!', 'error', 'Error Sistem');
            }
        }

        // Export history to Excel
        async function exportHistoryToExcel() {
            try {
                // Create CSV content
                let csvContent = '';
                
                if (selectedExportOption === 'detailed') {
                    // Header dengan format yang lebih rapih
                    csvContent = '"LAPORAN RIWAYAT AKSI ADMIN PEMILU OSIS"\n\n';
                    csvContent += '"Tanggal Export","' + new Date().toLocaleDateString('id-ID') + '"\n';
                    csvContent += '"Total Riwayat","' + actionHistory.length + '"\n\n';
                    
                    // Header tabel
                    csvContent += '"No","Waktu","Jenis Aksi","Deskripsi"\n';
                    
                    // Data
                    actionHistory.forEach((action, index) => {
                        csvContent += `"${index + 1}","${action.timestamp}","${getActionTypeText(action.type)}","${action.description}"\n`;
                    });
                } else {
                    // Format sederhana
                    csvContent = '"Waktu","Jenis Aksi","Deskripsi"\n';
                    
                    actionHistory.forEach(action => {
                        csvContent += `"${action.timestamp}","${getActionTypeText(action.type)}","${action.description}"\n`;
                    });
                }

                // Create and download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `riwayat_aksi_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                addToHistory('export', 'Export riwayat aksi ke Excel', null, null);
                showToast('Riwayat aksi berhasil di-export!', 'success');

            } catch (error) {
                console.error('Error exporting history:', error);
                showToast('Error saat export riwayat aksi!', 'error', 'Error Sistem');
            }
        }

        // Get action type text
        function getActionTypeText(type) {
            const types = {
                'add_vote': 'Tambah Suara',
                'edit_vote': 'Edit Suara',
                'delete_vote': 'Hapus Suara',
                'add_candidate': 'Tambah Kandidat',
                'edit_candidate': 'Edit Kandidat',
                'delete_candidate': 'Hapus Kandidat',
                'edit_settings': 'Edit Pengaturan',
                'reset_votes': 'Reset Suara',
                'reset_all': 'Reset Semua Data',
                'export': 'Export Data'
            };
            return types[type] || type;
        }

        // Export all data to Excel
        async function exportAllDataToExcel() {
            try {
                const [votesSnapshot, candidatesSnapshot, settingsSnapshot] = await Promise.all([
                    database.ref('votes').once('value'),
                    database.ref('candidates').once('value'),
                    database.ref('settings').once('value')
                ]);
                
                const votesData = votesSnapshot.val() || {};
                const candidates = candidatesSnapshot.val() || {};
                const settings = settingsSnapshot.val() || {};

                // Create a zip file with multiple CSV files
                const zip = new JSZip();
                
                // Votes data
                let votesCsvContent = '"LAPORAN DATA SUARA PEMILU OSIS"\n\n';
                votesCsvContent += '"Tanggal Export","' + new Date().toLocaleDateString('id-ID') + '"\n\n';
                votesCsvContent += '"No","NIPD/NIS","Kandidat","Tanggal","Waktu"\n';
                
                let voteCount = 0;
                for (const date in votesData) {
                    if (votesData[date] && typeof votesData[date] === 'object') {
                        for (const nipd in votesData[date]) {
                            const vote = votesData[date][nipd];
                            const candidate = candidates[vote.candidateId];
                            votesCsvContent += `"${voteCount + 1}","${nipd}","${candidate ? `${candidate.nomor} - ${candidate.nama}` : 'Unknown'}","${new Date(date).toLocaleDateString('id-ID')}","${vote.time}"\n`;
                            voteCount++;
                        }
                    }
                }
                zip.file("data_suara.csv", votesCsvContent);

                // Candidates data
                let candidatesCsvContent = '"LAPORAN DATA KANDIDAT PEMILU OSIS"\n\n';
                candidatesCsvContent += '"Tanggal Export","' + new Date().toLocaleDateString('id-ID') + '"\n\n';
                candidatesCsvContent += '"No","Nomor","Nama","Kelas","Visi","Misi","Program","Jargon","Tagline","Jumlah Suara"\n';
                
                Object.values(candidates).forEach((candidate, index) => {
                    let programText = '';
                    if (candidate.program) {
                        if (typeof candidate.program === 'object' && candidate.program.judul) {
                            programText = `${candidate.program.judul}: ${candidate.program.deskripsi}`;
                        } else if (Array.isArray(candidate.program)) {
                            programText = candidate.program.join(', ');
                        }
                    }

                    candidatesCsvContent += `"${index + 1}","${candidate.nomor}","${candidate.nama}","${candidate.kelas}","${candidate.visi}","${Array.isArray(candidate.misi) ? candidate.misi.join('; ') : candidate.misi}","${programText}","${candidate.jargon || ''}","${candidate.tagline || ''}","${candidate.votes || 0}"\n`;
                });
                zip.file("data_kandidat.csv", candidatesCsvContent);

                // Settings data
                let settingsCsvContent = '"LAPORAN PENGATURAN SISTEM PEMILU OSIS"\n\n';
                settingsCsvContent += '"Tanggal Export","' + new Date().toLocaleDateString('id-ID') + '"\n\n';
                settingsCsvContent += '"Pengaturan","Nilai"\n';
                for (const key in settings) {
                    settingsCsvContent += `"${key}","${settings[key]}"\n`;
                }
                zip.file("pengaturan.csv", settingsCsvContent);

                // History data
                let historyCsvContent = '"LAPORAN RIWAYAT AKSI ADMIN PEMILU OSIS"\n\n';
                historyCsvContent += '"Tanggal Export","' + new Date().toLocaleDateString('id-ID') + '"\n\n';
                historyCsvContent += '"No","Waktu","Jenis Aksi","Deskripsi"\n';
                actionHistory.forEach((action, index) => {
                    historyCsvContent += `"${index + 1}","${action.timestamp}","${getActionTypeText(action.type)}","${action.description}"\n`;
                });
                zip.file("riwayat_aksi.csv", historyCsvContent);

                // Generate zip file
                const content = await zip.generateAsync({type: "blob"});
                const link = document.createElement('a');
                const url = URL.createObjectURL(content);
                link.setAttribute('href', url);
                link.setAttribute('download', `backup_data_pemilu_${new Date().toISOString().split('T')[0]}.zip`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                addToHistory('export', 'Export semua data ke Excel', null, null);
                showToast('Semua data berhasil di-export!', 'success');

            } catch (error) {
                console.error('Error exporting all data:', error);
                showToast('Error saat export semua data!', 'error', 'Error Sistem');
            }
        }

        // Logout
        function logout() {
            if (confirm('Yakin ingin logout?')) {
                // Remove real-time listeners
                for (const key in realTimeListeners) {
                    database.ref(key).off('value', realTimeListeners[key]);
                }
                window.location.href = 'deepseek_html_20251013_701cdf.html';
            }
        }

        // Close modals when clicking outside
        document.getElementById('vote-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeVoteModal();
            }
        });

        document.getElementById('candidate-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeCandidateModal();
            }
        });

        document.getElementById('export-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeExportModal();
            }
        });

        // Input validation
        document.getElementById('vote-nipd').addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12);
        });

        document.getElementById('candidate-number').addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2);
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            for (const key in realTimeListeners) {
                database.ref(key).off('value', realTimeListeners[key]);
            }
        });
   