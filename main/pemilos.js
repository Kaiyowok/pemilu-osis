        // Firebase Configuration for OSIS
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
        let candidates = []; // Will be loaded from Firebase
        let currentPage = 'landing';
        let selectedCandidate = null;
        let studentData = null;
        let totalStudents = 1200; // Default, will be updated from Firebase
        let realTimeListeners = [];

        // Create particles for background
        function createParticles() {
            const particlesContainer = document.getElementById('particles');
            const particleCount = 30;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.classList.add('particle');
                
                // Random size between 3px and 8px
                const size = Math.random() * 5 + 3;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                
                // Random position
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = `${Math.random() * 100}%`;
                
                // Random animation delay
                particle.style.animationDelay = `${Math.random() * 15}s`;
                
                particlesContainer.appendChild(particle);
            }
        }

        // Countdown timer for voting period
        function startCountdown() {
            // Set the end date for voting
            const endDate = new Date('October 17, 2025 11:30:00').getTime();
            
            const timer = setInterval(function() {
                const now = new Date().getTime();
                const distance = endDate - now;
                
                // If voting period has ended
                if (distance < 0) {
                    clearInterval(timer);
                    document.getElementById('countdown-timer').innerHTML = '<div class="alert alert-error">Masa voting telah berakhir</div>';
                    return;
                }
                
                // Calculate days, hours, minutes and seconds
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                
                // Display the results
                document.getElementById('days').textContent = days.toString().padStart(2, '0');
                document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
                document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
                document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
            }, 1000);
        }

        // Load candidates from Firebase
        async function loadCandidatesFromFirebase() {
            try {
                const candidatesRef = database.ref('candidates');
                const snapshot = await candidatesRef.once('value');
                const candidatesData = snapshot.val();
                
                if (candidatesData) {
                    // Convert Firebase object to array format
                    candidates = Object.keys(candidatesData).map(key => ({
                        id: key,
                        nomor: candidatesData[key].nomor || key.padStart(2, '0'),
                        nama: candidatesData[key].nama || 'Nama Kandidat',
                        kelas: candidatesData[key].kelas || 'Kelas',
                        visi: candidatesData[key].visi || 'Visi kandidat',
                        misi: candidatesData[key].misi || [],
                        program: candidatesData[key].program || {
                            judul: 'Program Unggulan',
                            deskripsi: 'Deskripsi program unggulan kandidat'
                        },
                        jargon: candidatesData[key].jargon || 'Jargon belum tersedia',
                        tagline: candidatesData[key].tagline || 'Tagline belum tersedia',
                        votes: candidatesData[key].votes || 0
                    }));
                    
                    console.log('✅ Candidates loaded from Firebase:', candidates.length, 'candidates');
                    
                    // Update candidate count on landing page
                    document.getElementById('candidate-count').textContent = candidates.length;
                    document.getElementById('candidate-count-card').textContent = candidates.length;
                } else {
                    console.log('⚠️ No candidates found in Firebase');
                    // Create default candidates for demo
                    candidates = [
                        {
                            id: '1',
                            nomor: '01',
                            nama: 'Ahmad Fauzi',
                            kelas: 'XI MIPA 1',
                            visi: 'Mewujudkan OSIS yang inovatif, kreatif, dan berintegritas untuk kemajuan SMAN 23 Bandung',
                            misi: [
                                'Meningkatkan kualitas kegiatan ekstrakurikuler',
                                'Mengoptimalkan peran OSIS dalam kegiatan sekolah',
                                'Membangun komunikasi yang efektif antara siswa dan pihak sekolah'
                            ],
                            program: {
                                judul: 'Program Mentoring Akademik',
                                deskripsi: 'Membentuk sistem mentoring antar siswa untuk meningkatkan prestasi akademik dan non-akademik dengan pendekatan peer-to-peer learning.'
                            },
                            jargon: 'Bersama Membangun Prestasi!',
                            tagline: 'OSIS untuk semua, semua untuk OSIS',
                            votes: 0
                        },
                        {
                            id: '2',
                            nomor: '02',
                            nama: 'Siti Rahmawati',
                            kelas: 'XI IPS 2',
                            visi: 'Menjadikan OSIS sebagai wadah pengembangan potensi siswa yang unggul dan berkarakter',
                            misi: [
                                'Mengembangkan program kepemimpinan siswa',
                                'Meningkatkan partisipasi siswa dalam kegiatan OSIS',
                                'Memperkuat rasa kebersamaan dan solidaritas'
                            ],
                            program: {
                                judul: 'Festival Seni dan Budaya',
                                deskripsi: 'Mengadakan festival seni dan budaya tahunan untuk menampung dan mengapresiasi bakat seni siswa serta melestarikan budaya lokal.'
                            },
                            jargon: 'Sinergi untuk Perubahan!',
                            tagline: 'OSIS yang melayani, menginspirasi, dan berkarya',
                            votes: 0
                        },
                        {
                            id: '3',
                            nomor: '03',
                            nama: 'Rizki Pratama',
                            kelas: 'X MIPA 3',
                            visi: 'Menciptakan lingkungan sekolah yang harmonis, kreatif, dan berprestasi melalui OSIS',
                            misi: [
                                'Memperkuat komunikasi antara OSIS dan siswa',
                                'Mengembangkan bakat dan minat siswa',
                                'Meningkatkan kepedulian sosial siswa'
                            ],
                            program: {
                                judul: 'OSIS Peduli Lingkungan',
                                deskripsi: 'Program penghijauan sekolah dan pengelolaan sampah yang melibatkan seluruh warga sekolah untuk menciptakan lingkungan yang bersih dan sehat.'
                            },
                            jargon: 'Inovasi dan Kolaborasi!',
                            tagline: 'OSIS yang progresif dan responsif terhadap kebutuhan siswa',
                            votes: 0
                        }
                    ];
                }
            } catch (error) {
                console.error('❌ Error loading candidates from Firebase:', error);
                // Create default candidates if Firebase fails
                candidates = [
                    {
                        id: '1',
                        nomor: '01',
                        nama: 'Ahmad Fauzi',
                        kelas: 'XI MIPA 1',
                        visi: 'Mewujudkan OSIS yang inovatif, kreatif, dan berintegritas untuk kemajuan SMAN 23 Bandung',
                        misi: [
                            'Meningkatkan kualitas kegiatan ekstrakurikuler',
                            'Mengoptimalkan peran OSIS dalam kegiatan sekolah',
                            'Membangun komunikasi yang efektif antara siswa dan pihak sekolah'
                        ],
                        program: {
                            judul: 'Program Mentoring Akademik',
                            deskripsi: 'Membentuk sistem mentoring antar siswa untuk meningkatkan prestasi akademik dan non-akademik dengan pendekatan peer-to-peer learning.'
                        },
                        jargon: 'Bersama Membangun Prestasi!',
                        tagline: 'OSIS untuk semua, semua untuk OSIS',
                        votes: 0
                    },
                    {
                        id: '2',
                        nomor: '02',
                        nama: 'Siti Rahmawati',
                        kelas: 'XI IPS 2',
                        visi: 'Menjadikan OSIS sebagai wadah pengembangan potensi siswa yang unggul dan berkarakter',
                        misi: [
                            'Mengembangkan program kepemimpinan siswa',
                            'Meningkatkan partisipasi siswa dalam kegiatan OSIS',
                            'Memperkuat rasa kebersamaan dan solidaritas'
                        ],
                        program: {
                            judul: 'Festival Seni dan Budaya',
                            deskripsi: 'Mengadakan festival seni dan budaya tahunan untuk menampung dan mengapresiasi bakat seni siswa serta melestarikan budaya lokal.'
                        },
                        jargon: 'Sinergi untuk Perubahan!',
                        tagline: 'OSIS yang melayani, menginspirasi, dan berkarya',
                        votes: 0
                    },
                    {
                        id: '3',
                        nomor: '03',
                        nama: 'Rizki Pratama',
                        kelas: 'X MIPA 3',
                        visi: 'Menciptakan lingkungan sekolah yang harmonis, kreatif, dan berprestasi melalui OSIS',
                        misi: [
                            'Memperkuat komunikasi antara OSIS dan siswa',
                            'Mengembangkan bakat dan minat siswa',
                            'Meningkatkan kepedulian sosial siswa'
                        ],
                        program: {
                            judul: 'OSIS Peduli Lingkungan',
                            deskripsi: 'Program penghijauan sekolah dan pengelolaan sampah yang melibatkan seluruh warga sekolah untuk menciptakan lingkungan yang bersih dan sehat.'
                        },
                        jargon: 'Inovasi dan Kolaborasi!',
                        tagline: 'OSIS yang progresif dan responsif terhadap kebutuhan siswa',
                        votes: 0
                    }
                ];
            }
        }

        // Load settings from Firebase
        async function loadSettingsFromFirebase() {
            try {
                const settingsRef = database.ref('settings');
                const snapshot = await settingsRef.once('value');
                const settings = snapshot.val();
                
                if (settings) {
                    totalStudents = settings.totalStudents || 1200;
                    console.log('✅ Settings loaded from Firebase. Total students:', totalStudents);
                }
            } catch (error) {
                console.error('❌ Error loading settings from Firebase:', error);
            }
        }

        // Load real-time statistics with enhanced error handling
        function loadStatistics() {
            // Clear existing listeners
            realTimeListeners.forEach(listener => {
                if (listener && typeof listener.off === 'function') {
                    listener.off();
                }
            });
            realTimeListeners = [];

            try {
                // Listen to votes changes
                const votesListener = database.ref('votes').on('value', (snapshot) => {
                    try {
                        const votesData = snapshot.val() || {};
                        let totalVotes = 0;
                        
                        // Count total votes dari semua tanggal
                        for (const date in votesData) {
                            if (votesData[date] && typeof votesData[date] === 'object') {
                                totalVotes += Object.keys(votesData[date]).length;
                            }
                        }
                        
                        const participationRate = totalStudents > 0 ? ((totalVotes / totalStudents) * 100).toFixed(1) : '0.0';
                        const remainingStudents = Math.max(0, totalStudents - totalVotes);

                        // Update UI with smooth animation
                        updateStatWithAnimation('total-votes', totalVotes.toLocaleString('id-ID'));
                        updateStatWithAnimation('participation-rate', participationRate + '%');
                        updateStatWithAnimation('remaining-students', remainingStudents.toLocaleString('id-ID'));

                        console.log(`📊 Stats updated: ${totalVotes} votes, ${participationRate}% participation`);
                    } catch (error) {
                        console.error('❌ Error processing votes data:', error);
                    }
                }, (error) => {
                    console.error('❌ Error listening to votes:', error);
                });

                // Listen to settings changes
                const settingsListener = database.ref('settings').on('value', (snapshot) => {
                    try {
                        const settings = snapshot.val();
                        if (settings && settings.totalStudents) {
                            totalStudents = settings.totalStudents;
                        }
                    } catch (error) {
                        console.error('❌ Error processing settings data:', error);
                    }
                }, (error) => {
                    console.error('❌ Error listening to settings:', error);
                });

                // Listen to candidates changes (for real-time vote count updates)
                const candidatesListener = database.ref('candidates').on('value', (snapshot) => {
                    try {
                        const candidatesData = snapshot.val();
                        if (candidatesData) {
                            // Update candidates array with latest vote counts
                            candidates.forEach(candidate => {
                                if (candidatesData[candidate.id]) {
                                    candidate.votes = candidatesData[candidate.id].votes || 0;
                                }
                            });
                            
                            // Update candidate count on landing page
                            const candidateCount = Object.keys(candidatesData).length;
                            document.getElementById('candidate-count').textContent = candidateCount;
                            document.getElementById('candidate-count-card').textContent = candidateCount;
                        }
                    } catch (error) {
                        console.error('❌ Error processing candidates data:', error);
                    }
                }, (error) => {
                    console.error('❌ Error listening to candidates:', error);
                });

                realTimeListeners.push(votesListener, settingsListener, candidatesListener);
            } catch (error) {
                console.error('❌ Error setting up real-time listeners:', error);
            }
        }

        // Update stat with smooth animation
        function updateStatWithAnimation(elementId, newValue) {
            const element = document.getElementById(elementId);
            if (element && element.textContent !== newValue) {
                element.style.transform = 'scale(1.1)';
                element.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                element.textContent = newValue;
                
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 400);
            }
        }

        // Check if student has already voted
        async function checkIfVoted(nipd) {
            try {
                const votesRef = database.ref('votes');
                const snapshot = await votesRef.once('value');
                const votesData = snapshot.val() || {};
                
                for (const date in votesData) {
                    if (votesData[date] && votesData[date][nipd]) {
                        return true;
                    }
                }
                return false;
            } catch (error) {
                console.error('❌ Error checking vote status:', error);
                return false;
            }
        }

        // Save vote to Firebase
        async function saveVote(nipd, candidateId) {
            try {
                const now = new Date();
                const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
                const time = now.toTimeString().split(' ')[0]; // HH:MM:SS
                
                // Double-check if already voted
                const hasVoted = await checkIfVoted(nipd);
                if (hasVoted) {
                    throw new Error('Student has already voted');
                }
                
                // Save vote record
                await database.ref(`votes/${date}/${nipd}`).set({
                    nipd: nipd,
                    candidateId: candidateId,
                    time: time,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });

                // Update candidate vote count
                const candidateRef = database.ref(`candidates/${candidateId}`);
                const candidateSnapshot = await candidateRef.once('value');
                const candidateData = candidateSnapshot.val();
                
                if (candidateData) {
                    const currentVotes = candidateData.votes || 0;
                    await candidateRef.update({ votes: currentVotes + 1 });
                } else {
                    // Jika kandidat tidak ada, buat data baru
                    await candidateRef.set({
                        nomor: candidateId.padStart(2, '0'),
                        nama: `Kandidat ${candidateId.padStart(2, '0')}`,
                        kelas: 'Kelas',
                        visi: 'Visi kandidat',
                        misi: [],
                        program: {
                            judul: 'Program Unggulan',
                            deskripsi: 'Deskripsi program unggulan kandidat'
                        },
                        jargon: 'Jargon kandidat',
                        tagline: 'Tagline kandidat',
                        votes: 1
                    });
                }

                console.log('✅ Vote saved successfully');
                return true;
            } catch (error) {
                console.error('❌ Error saving vote:', error);
                return false;
            }
        }

        // Navigation
        function navigateTo(page) {
            // Add page transition animation
            document.querySelectorAll('.page').forEach(p => {
                p.classList.add('hidden');
                p.style.opacity = '0';
                p.style.transform = 'translateY(20px)';
            });
            
            const targetPage = document.getElementById(page + '-page');
            targetPage.classList.remove('hidden');
            
            // Trigger reflow
            targetPage.offsetHeight;
            
            // Apply animation
            targetPage.style.opacity = '1';
            targetPage.style.transform = 'translateY(0)';
            targetPage.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            currentPage = page;

            if (page === 'voting') {
                checkLoginStatus();
                renderCandidates();
                updateStudentInfo();
            } else if (page === 'landing') {
                loadStatistics();
            }
        }

        // Login functionality
        document.getElementById('login-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nipd = document.getElementById('nipd').value.trim();
            const errorDiv = document.getElementById('login-error');
            const loginBtn = document.getElementById('login-btn');

            errorDiv.classList.add('hidden');

            if (!nipd || nipd.length !== 9 || !/^\d+$/.test(nipd)) {
                showError('NIS harus berupa 9 digit angka');
                return;
            }

            loginBtn.innerHTML = '<div class="spinner"></div> Memverifikasi...';
            loginBtn.disabled = true;

            try {
                const hasVoted = await checkIfVoted(nipd);
                if (hasVoted) {
                    showError('Anda sudah melakukan voting sebelumnya. Setiap siswa hanya dapat voting satu kali.');
                    resetLoginButton();
                    return;
                }

                await new Promise(resolve => setTimeout(resolve, 1500));

                studentData = { nipd };
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('studentNIPD', nipd);

                navigateTo('voting');
            } catch (error) {
                console.error('❌ Login error:', error);
                showError('Terjadi kesalahan sistem. Silakan coba lagi.');
                resetLoginButton();
            }

            function showError(message) {
                errorDiv.textContent = message;
                errorDiv.classList.remove('hidden');
            }

            function resetLoginButton() {
                loginBtn.innerHTML = '<i class="fas fa-vote-yea"></i> MASUK & MULAI VOTING';
                loginBtn.disabled = false;
            }
        });

        // Input formatting
        document.getElementById('nipd').addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12);
        });

        // Check login status
        async function checkLoginStatus() {
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            const nipd = localStorage.getItem('studentNIPD');

            if (!isLoggedIn || !nipd) {
                navigateTo('login');
                return false;
            }

            try {
                const hasVoted = await checkIfVoted(nipd);
                if (hasVoted) {
                    showSuccessPage();
                    return false;
                }
                studentData = { nipd };
                return true;
            } catch (error) {
                console.error('❌ Error checking login status:', error);
                navigateTo('login');
                return false;
            }
        }

        // Update student info
        function updateStudentInfo() {
            if (studentData) {
                document.getElementById('student-info').textContent = 
                    `NIS: ${studentData.nipd}`;
            }
        }

        // Render candidates
        function renderCandidates() {
            const grid = document.getElementById('candidates-grid');
            grid.innerHTML = '';

            if (candidates.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                        <div class="spinner" style="margin: 0 auto 1rem;"></div>
                        <p style="color: var(--gray-600); font-size: 1.125rem; font-weight: 500;">Memuat data kandidat...</p>
                    </div>
                `;
                return;
            }

            candidates.forEach(candidate => {
                const candidateDiv = document.createElement('div');
                candidateDiv.innerHTML = `
                    <div class="candidate-card card" data-candidate-id="${candidate.id}">
                        <div class="card-header text-center" style="position: relative; padding-bottom: 1.5rem;">
                            <!-- Gunakan gambar kandidat atau fallback ke ikon -->
                            <img src="/pemilu-osis/assets/${candidate.nama}.png" alt="${candidate.nama}" class="candidate-photo" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="candidate-photo" style="background: linear-gradient(135deg, var(--primary-500), var(--blue-500)); display: none; align-items: center; justify-content: center; color: white; font-size: 3rem;">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="candidate-number">${candidate.nomor}</div>
                            <div class="card-title" style="font-size: 1.5rem; color: var(--gray-900);">${candidate.nama}</div>
                            <div class="card-description" style="font-size: 1.125rem; color: var(--primary-600); font-weight: 600;">${candidate.kelas}</div>
                        </div>
                        <div class="card-content" style="padding-top: 0;">
                            <button class="candidate-select-btn btn btn-secondary btn-animated" style="width: 100%; padding: 1rem; font-size: 1.125rem; font-weight: 600;" onclick="selectCandidate('${candidate.id}')">
                                <i class="fas fa-user"></i> PILIH KANDIDAT
                            </button>
                        </div>
                    </div>
                    <div class="card mt-6">
                        <div class="card-header">
                            <div class="card-title" style="color: var(--primary-700);"><i class="fas fa-eye"></i> Detail Kandidat ${candidate.nomor}</div>
                        </div>
                        <div class="card-content">
                            <!-- Jargon Section -->
                            <div class="candidate-jargon">
                                <i class="fas fa-quote-left"></i> ${candidate.jargon} <i class="fas fa-quote-right"></i>
                            </div>
                            
                            <!-- Tagline Section -->
                            <div class="candidate-tagline">
                                <i class="fas fa-bullhorn"></i> ${candidate.tagline}
                            </div>
                            
                            <div class="tabs">
                                <div class="tab-list">
                                    <button class="tab-button active" onclick="switchTab(this, 'visi-${candidate.id}')"><i class="fas fa-bullseye"></i> Visi</button>
                                    <button class="tab-button" onclick="switchTab(this, 'misi-${candidate.id}')"><i class="fas fa-lightbulb"></i> Misi</button>
                                    <button class="tab-button" onclick="switchTab(this, 'program-${candidate.id}')"><i class="fas fa-tasks"></i> Program</button>
                                </div>
                                <div id="visi-${candidate.id}" class="tab-content active">
                                    <h4 class="font-semibold mb-3" style="color: var(--primary-600); font-size: 1.125rem;"><i class="fas fa-bullseye"></i> Visi</h4>
                                    <p style="font-size: 0.875rem; color: var(--gray-700); line-height: 1.7; background: var(--primary-50); padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--primary-200);">
                                        ${candidate.visi}
                                    </p>
                                </div>
                                <div id="misi-${candidate.id}" class="tab-content">
                                    <h4 class="font-semibold mb-3" style="color: var(--blue-600); font-size: 1.125rem;"><i class="fas fa-lightbulb"></i> Misi</h4>
                                    <ul style="list-style: none; padding: 0;">
                                        ${Array.isArray(candidate.misi) ? candidate.misi.map((misi, index) => `
                                            <li style="font-size: 0.875rem; color: var(--gray-700); display: flex; align-items: flex-start; background: var(--info-50); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--primary-200); margin-bottom: 0.75rem;">
                                                <span style="width: 1.5rem; height: 1.5rem; background: linear-gradient(135deg, var(--blue-600), var(--primary-600)); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; margin-right: 0.75rem; margin-top: 0.125rem; flex-shrink: 0;">
                                                    ${index + 1}
                                                </span>
                                                <span style="line-height: 1.6;">${misi}</span>
                                            </li>
                                        `).join('') : '<p style="color: var(--gray-500); font-style: italic;">Misi belum tersedia</p>'}
                                    </ul>
                                </div>
                                <div id="program-${candidate.id}" class="tab-content">
                                    <h4 class="font-semibold mb-3" style="color: var(--primary-600); font-size: 1.125rem;"><i class="fas fa-tasks"></i> Program</h4>
                                    <div class="program-card">
                                        <div class="program-title">
                                            <i class="fas fa-star"></i> ${candidate.program.judul}
                                        </div>
                                        <div class="program-description">
                                            ${candidate.program.deskripsi}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(candidateDiv);
            });
        }

        // Select candidate
        function selectCandidate(candidateId) {
            selectedCandidate = candidateId;
    
            document.querySelectorAll('.candidate-card').forEach(card => {
                card.classList.remove('selected');
            });
    
            document.querySelectorAll('.candidate-select-btn').forEach(btn => {
                btn.innerHTML = '<i class="fas fa-user"></i> PILIH KANDIDAT';
                btn.className = 'candidate-select-btn btn btn-secondary btn-animated';
            });

            const selectedCard = document.querySelector(`[data-candidate-id="${candidateId}"]`);
            const selectedBtn = selectedCard.querySelector('.candidate-select-btn');
    
            selectedCard.classList.add('selected');
            selectedBtn.innerHTML = '<i class="fas fa-check"></i> TERPILIH';
            selectedBtn.className = 'candidate-select-btn btn btn-primary btn-animated';

            updateConfirmationSection();
        }

        // Update confirmation section
        function updateConfirmationSection() {
            const infoDiv = document.getElementById('selected-candidate-info');
            const submitBtn = document.getElementById('submit-vote-btn');
            const helpText = document.getElementById('submit-help-text');

            if (selectedCandidate) {
                const candidate = candidates.find(c => c.id === selectedCandidate);
                if (candidate) {
                    infoDiv.innerHTML = `
                        <div class="alert alert-info">
                            <p class="font-semibold mb-3" style="color: var(--info-600); font-size: 1.125rem;">Kandidat Terpilih:</p>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 1.5rem;">
                                <div class="badge badge-outline" style="font-size: 1.5rem; font-weight: bold; padding: 0.75rem 1rem;">
                                    ${candidate.nomor}
                                </div>
                                <div>
                                    <p style="font-size: 1.375rem; font-weight: 700; color: var(--info-600);">
                                        ${candidate.nama}
                                    </p>
                                    <p style="color: var(--primary-600); margin-top: 0.25rem; font-weight: 600;">${candidate.kelas}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    submitBtn.disabled = false;
                    submitBtn.style.background = 'linear-gradient(135deg, var(--primary-600), var(--blue-600))';
                    submitBtn.style.cursor = 'pointer';
                    helpText.style.display = 'none';
                }
            } else {
                infoDiv.innerHTML = `
                    <div class="alert alert-warning">
                        <p class="font-medium">Belum ada kandidat yang dipilih</p>
                    </div>
                `;
                submitBtn.disabled = true;
                submitBtn.style.background = 'var(--gray-300)';
                submitBtn.style.cursor = 'not-allowed';
                helpText.style.display = 'block';
            }
        }

        // Submit vote
        document.getElementById('submit-vote-btn').addEventListener('click', function() {
            if (!selectedCandidate) return;
    
            const modal = document.getElementById('confirmation-modal');
            const candidate = candidates.find(c => c.id === selectedCandidate);
    
            if (candidate) {
                document.getElementById('modal-candidate-info').innerHTML = `
                    <p class="font-semibold mb-3" style="color: var(--info-600);">Pilihan Anda:</p>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="badge badge-outline" style="font-size: 1.25rem; font-weight: bold;">
                            ${candidate.nomor}
                        </div>
                        <div>
                            <p class="font-bold" style="color: var(--info-600); font-size: 1.125rem;">${candidate.nama}</p>
                            <p style="font-size: 0.875rem; color: var(--primary-600); font-weight: 600;">${candidate.kelas}</p>
                        </div>
                    </div>
                `;
        
                modal.classList.remove('hidden');
                setTimeout(() => modal.classList.add('active'), 10);
            }
        });

        // Confirm vote
        document.getElementById('confirm-vote-btn').addEventListener('click', async function() {
            const btn = this;
            btn.innerHTML = '<div class="spinner"></div> Menyimpan ke Database...';
            btn.disabled = true;

            try {
                const success = await saveVote(studentData.nipd, selectedCandidate);
        
                if (success) {
                    localStorage.setItem('selectedCandidate', selectedCandidate);
                    closeModal();
                    showSuccessPage();
                } else {
                    throw new Error('Failed to save vote');
                }
            } catch (error) {
                console.error('❌ Error submitting vote:', error);
                alert('Terjadi kesalahan saat menyimpan suara. Silakan coba lagi.');
                btn.innerHTML = '<i class="fas fa-check"></i> Ya, Submit';
                btn.disabled = false;
            }
        });

        // Show success page
        function showSuccessPage() {
            const candidate = candidates.find(c => c.id === selectedCandidate);
    
            document.getElementById('success-info').innerHTML = `
                <strong>NIS:</strong> ${studentData.nipd}<br>
                <strong>Status:</strong> Sudah Voting <i class="fas fa-check"></i><br>
                <strong>Waktu:</strong> ${new Date().toLocaleString('id-ID')}<br>
                ${candidate ? `<strong>Pilihan:</strong> ${candidate.nomor} - ${candidate.nama}` : ''}
            `;
    
            navigateTo('success');
        }

        // Modal functions
        function closeModal() {
            const modal = document.getElementById('confirmation-modal');
            modal.classList.remove('active');
            
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
            
            document.getElementById('confirm-vote-btn').innerHTML = '<i class="fas fa-check"></i> Ya, Submit';
            document.getElementById('confirm-vote-btn').disabled = false;
        }

        // Tab switching
        function switchTab(button, tabId) {
            const tabList = button.parentElement;
            tabList.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const tabsContainer = tabList.parentElement;
            tabsContainer.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            document.getElementById(tabId).classList.add('active');
        }

        // Accordion functionality
        function toggleAccordion(index) {
            const items = document.querySelectorAll('.accordion-item');
            const content = items[index].querySelector('.accordion-content');
            const trigger = items[index].querySelector('.accordion-trigger span');
    
            if (content.classList.contains('active')) {
                content.classList.remove('active');
                trigger.textContent = '▼';
            } else {
                items.forEach((item, i) => {
                    if (i !== index) {
                        item.querySelector('.accordion-content').classList.remove('active');
                        item.querySelector('.accordion-trigger span').textContent = '▼';
                    }
                });
        
                content.classList.add('active');
                trigger.textContent = '▲';
            }
        }

        // Logout
        function logout() {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('studentNIPD');
            localStorage.removeItem('selectedCandidate');
    
            realTimeListeners.forEach(listener => {
                if (listener && typeof listener.off === 'function') {
                    listener.off();
                }
            });
            realTimeListeners = [];
    
            selectedCandidate = null;
            studentData = null;
    
            navigateTo('landing');
        }

        // Initialize app
        document.addEventListener('DOMContentLoaded', async function() {
            console.log('🚀 Initializing E-Voting System for OSIS...');
    
            try {
                // Create particles
                createParticles();
                
                // Start countdown timer
                startCountdown();
                
                // Simulate loading
                setTimeout(() => {
                    document.getElementById('loading-screen').classList.add('hidden');
                }, 2000);
                
                // Load data from Firebase
                await loadCandidatesFromFirebase();
                await loadSettingsFromFirebase();
        
                // Load statistics
                loadStatistics();

                // Check login status
                const isLoggedIn = localStorage.getItem('isLoggedIn');
                const nipd = localStorage.getItem('studentNIPD');

                if (isLoggedIn && nipd) {
                    studentData = { nipd };
            
                    try {
                        const hasVoted = await checkIfVoted(nipd);
                        if (hasVoted) {
                            selectedCandidate = localStorage.getItem('selectedCandidate');
                            showSuccessPage();
                        } else {
                            navigateTo('voting');
                        }
                    } catch (error) {
                        console.error('❌ Error checking vote status:', error);
                        navigateTo('landing');
                    }
                } else {
                    navigateTo('landing');
                }

                // Add scroll effect to header
                window.addEventListener('scroll', function() {
                    const header = document.getElementById('header');
                    if (window.scrollY > 50) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                });

                console.log('✅ E-Voting System for OSIS initialized successfully');
            } catch (error) {
                console.error('❌ Error initializing app:', error);
                navigateTo('landing');
            }
        });

        // Close modal when clicking outside
        document.getElementById('confirmation-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        // Connection monitoring
        let connectionCheckInterval;

        function startConnectionMonitoring() {
            connectionCheckInterval = setInterval(() => {
                if (currentPage === 'landing') {
                    database.ref('.info/connected').once('value', (snapshot) => {
                        if (snapshot.val() === true) {
                            console.log('🔗 Firebase connection active');
                        } else {
                            console.log('⚠️ Firebase connection lost, attempting to reconnect...');
                        }
                    });
                }
            }, 30000);
        }

        startConnectionMonitoring();

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            if (connectionCheckInterval) {
                clearInterval(connectionCheckInterval);
            }
    
            realTimeListeners.forEach(listener => {
                if (listener && typeof listener.off === 'function') {
                    listener.off();
                }
            });
        });

        // Enhanced error handling for Firebase operations
        database.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                console.log('🔥 Connected to Firebase');
            } else {
                console.log('❌ Disconnected from Firebase');
            }
        });

        console.log('📱 E-Voting System for OSIS script loaded successfully');

    
