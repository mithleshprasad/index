document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const connectButton = document.getElementById('connect-button');
    const connectionStringInput = document.getElementById('connection-string');
    const databaseList = document.getElementById('database-list');
    const queryInput = document.getElementById('query-input');
    const executeQueryButton = document.getElementById('execute-query');
    const documentView = document.getElementById('document-view');
    const statusBar = document.getElementById('connection-status');
    const refreshDatabasesBtn = document.getElementById('refresh-databases');
    const createDatabaseBtn = document.getElementById('create-database');
    const themeToggle = document.getElementById('theme-toggle');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const queryLimit = document.getElementById('query-limit');
    const querySort = document.getElementById('query-sort');
    const querySortField = document.getElementById('query-sort-field');
    const insertDocumentBtn = document.getElementById('insert-document');
    const updateDocumentBtn = document.getElementById('update-document');
    const deleteDocumentBtn = document.getElementById('delete-document');
    const exportDocumentsBtn = document.getElementById('export-documents');
    const importDocumentsBtn = document.getElementById('import-documents');
    const queryBuilderToggle = document.getElementById('query-builder-toggle');
    const queryBuilder = document.getElementById('query-builder');
    const applyQueryBuilderBtn = document.getElementById('apply-query-builder');
    const createIndexBtn = document.getElementById('create-index');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const documentModal = document.getElementById('document-modal');
    const modalTitle = document.getElementById('modal-title');
    const saveModalBtn = document.getElementById('save-modal');
    const cancelModalBtn = document.getElementById('cancel-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const indexModal = document.getElementById('index-modal');
    const createIndexModalBtn = document.getElementById('create-index-btn');
    
    // JSON Editors
    let jsonEditor, filterEditor, projectionEditor, indexFieldsEditor, indexOptionsEditor;
    
    // Mock data for demonstration
    const mockDatabases = {
        'admin': ['system.users', 'system.version'],
        'local': ['startup_log'],
        'test': ['users', 'products', 'orders']
    };
    
    const mockDocuments = {
        'users': [
            { "_id": "1", "name": "Alice", "email": "alice@example.com", "age": 28, "createdAt": new Date() },
            { "_id": "2", "name": "Bob", "email": "bob@example.com", "age": 32, "createdAt": new Date() },
            { "_id": "3", "name": "Charlie", "email": "charlie@example.com", "age": 25, "createdAt": new Date() }
        ],
        'products': [
            { "_id": "101", "name": "Laptop", "price": 999.99, "stock": 15, "category": "electronics" },
            { "_id": "102", "name": "Phone", "price": 699.99, "stock": 30, "category": "electronics" },
            { "_id": "103", "name": "Tablet", "price": 499.99, "stock": 20, "category": "electronics" }
        ],
        'orders': [
            { "_id": "1001", "user_id": "1", "products": ["101"], "total": 999.99, "status": "completed" }
        ]
    };
    
    const mockIndexes = {
        'users': [
            { name: "_id_", fields: { "_id": 1 }, type: "BTREE" },
            { name: "email_1", fields: { "email": 1 }, type: "BTREE", unique: true }
        ],
        'products': [
            { name: "_id_", fields: { "_id": 1 }, type: "BTREE" },
            { name: "category_1", fields: { "category": 1 }, type: "BTREE" }
        ],
        'orders': [
            { name: "_id_", fields: { "_id": 1 }, type: "BTREE" }
        ]
    };
    
    const mockStats = {
        'users': { count: 3, storageSize: "45KB", indexSize: "20KB", avgObjSize: "450B" },
        'products': { count: 3, storageSize: "60KB", indexSize: "25KB", avgObjSize: "500B" },
        'orders': { count: 1, storageSize: "15KB", indexSize: "10KB", avgObjSize: "400B" }
    };
    
    // App state
    let currentState = {
        connected: false,
        currentDb: null,
        currentCollection: null,
        currentPage: 1,
        pageSize: 10,
        selectedDocument: null,
        darkMode: false
    };
    
    // Initialize JSON editors
    function initEditors() {
        jsonEditor = new JSONEditor(document.getElementById('json-editor'), {
            mode: 'tree',
            modes: ['tree', 'code', 'form', 'text', 'view'],
            onError: function(err) {
                alert(err.toString());
            }
        });
        
        filterEditor = new JSONEditor(document.getElementById('filter-builder'), {
            mode: 'tree',
            modes: ['tree', 'code'],
            onError: function(err) {
                alert(err.toString());
            }
        });
        
        projectionEditor = new JSONEditor(document.getElementById('projection-builder'), {
            mode: 'tree',
            modes: ['tree', 'code'],
            onError: function(err) {
                alert(err.toString());
            }
        });
        
        indexFieldsEditor = new JSONEditor(document.getElementById('index-fields'), {
            mode: 'tree',
            modes: ['tree', 'code'],
            onError: function(err) {
                alert(err.toString());
            }
        });
        
        indexOptionsEditor = new JSONEditor(document.getElementById('index-options'), {
            mode: 'tree',
            modes: ['tree', 'code'],
            onError: function(err) {
                alert(err.toString());
            }
        });
        
        // Set default values
        filterEditor.set({});
        projectionEditor.set({});
        indexFieldsEditor.set({ "field1": 1 });
        indexOptionsEditor.set({ "unique": false, "background": true });
    }
    
    // Connect button click handler
    connectButton.addEventListener('click', function() {
        const connectionString = connectionStringInput.value.trim();
        
        if (!connectionString) {
            alert('Please enter a connection string');
            return;
        }
        
        // In a real app, this would connect to your backend which connects to MongoDB
        currentState.connected = true;
        statusBar.textContent = `Connected to ${connectionString}`;
        statusBar.style.color = 'lightgreen';
        
        // Load mock databases
        loadDatabases();
    });
    
    // Load databases into the sidebar
    function loadDatabases() {
        databaseList.innerHTML = '';
        
        for (const dbName in mockDatabases) {
            const dbItem = document.createElement('li');
            dbItem.className = 'database-item';
            dbItem.innerHTML = `
                <div>
                    <i class="fas fa-database"></i> ${dbName}
                </div>
                <div class="database-actions">
                    <button class="drop-database" data-db="${dbName}" title="Drop Database"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            const collectionList = document.createElement('ul');
            collectionList.className = 'collection-list';
            
            mockDatabases[dbName].forEach(collectionName => {
                const collectionItem = document.createElement('li');
                collectionItem.className = 'collection-item';
                collectionItem.innerHTML = `
                    <div>
                        <i class="far fa-file-alt"></i> ${collectionName}
                    </div>
                    <div class="collection-actions">
                        <button class="drop-collection" data-db="${dbName}" data-collection="${collectionName}" title="Drop Collection"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                
                collectionItem.addEventListener('click', function() {
                    // Remove active class from all items
                    document.querySelectorAll('.collection-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Add active class to clicked item
                    collectionItem.classList.add('active');
                    
                    // Load documents for this collection
                    currentState.currentDb = dbName;
                    currentState.currentCollection = collectionName;
                    loadDocuments(collectionName);
                    loadCollectionStats(collectionName);
                    loadIndexes(collectionName);
                    
                    // Reset pagination
                    currentState.currentPage = 1;
                    updatePagination();
                });
                
                collectionList.appendChild(collectionItem);
            });
            
            // Add create collection button
            const createCollectionItem = document.createElement('li');
            createCollectionItem.className = 'collection-item';
            createCollectionItem.innerHTML = '<i class="fas fa-plus"></i> Create Collection';
            createCollectionItem.style.color = 'var(--primary-color)';
            createCollectionItem.addEventListener('click', function() {
                const collectionName = prompt('Enter collection name:');
                if (collectionName) {
                    // In a real app, this would create a collection in the database
                    mockDatabases[dbName].push(collectionName);
                    mockDocuments[collectionName] = [];
                    mockIndexes[collectionName] = [{ name: "_id_", fields: { "_id": 1 }, type: "BTREE" }];
                    mockStats[collectionName] = { count: 0, storageSize: "0KB", indexSize: "0KB", avgObjSize: "0B" };
                    loadDatabases();
                }
            });
            
            collectionList.appendChild(createCollectionItem);
            dbItem.appendChild(collectionList);
            databaseList.appendChild(dbItem);
        }
        
        // Add event listeners for drop database buttons
        document.querySelectorAll('.drop-database').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const dbName = this.getAttribute('data-db');
                if (confirm(`Are you sure you want to drop database '${dbName}'?`)) {
                    // In a real app, this would drop the database
                    delete mockDatabases[dbName];
                    delete mockDocuments[dbName];
                    delete mockIndexes[dbName];
                    delete mockStats[dbName];
                    loadDatabases();
                }
            });
        });
        
        // Add event listeners for drop collection buttons
        document.querySelectorAll('.drop-collection').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const dbName = this.getAttribute('data-db');
                const collectionName = this.getAttribute('data-collection');
                if (confirm(`Are you sure you want to drop collection '${collectionName}'?`)) {
                    // In a real app, this would drop the collection
                    const index = mockDatabases[dbName].indexOf(collectionName);
                    if (index > -1) {
                        mockDatabases[dbName].splice(index, 1);
                        delete mockDocuments[collectionName];
                        delete mockIndexes[collectionName];
                        delete mockStats[collectionName];
                        loadDatabases();
                    }
                }
            });
        });
    }
    
    // Load documents for a collection
    function loadDocuments(collectionName) {
        if (!collectionName) return;
        
        const limit = parseInt(queryLimit.value) || 0;
        const sortOrder = querySort.value ? parseInt(querySort.value) : 0;
        const sortField = querySortField.value;
        
        let documents = mockDocuments[collectionName] || [];
        
        // Apply sorting
        if (sortOrder && sortField) {
            documents.sort((a, b) => {
                if (a[sortField] < b[sortField]) return -1 * sortOrder;
                if (a[sortField] > b[sortField]) return 1 * sortOrder;
                return 0;
            });
        }
        
        // Apply pagination
        const startIdx = (currentState.currentPage - 1) * currentState.pageSize;
        const paginatedDocs = limit > 0 ? documents.slice(startIdx, startIdx + currentState.pageSize) : documents;
        
        documentView.textContent = JSON.stringify(paginatedDocs, null, 2);
        
        // Update stats
        document.getElementById('stat-count').textContent = documents.length;
        document.getElementById('stat-storage').textContent = mockStats[collectionName].storageSize;
        document.getElementById('stat-index-size').textContent = mockStats[collectionName].indexSize;
        document.getElementById('stat-avg-size').textContent = mockStats[collectionName].avgObjSize;
    }
    
    // Load collection stats
    function loadCollectionStats(collectionName) {
        if (!collectionName) return;
        
        const stats = mockStats[collectionName] || { count: 0, storageSize: "0KB", indexSize: "0KB", avgObjSize: "0B" };
        
        document.getElementById('stat-count').textContent = stats.count;
        document.getElementById('stat-storage').textContent = stats.storageSize;
        document.getElementById('stat-index-size').textContent = stats.indexSize;
        document.getElementById('stat-avg-size').textContent = stats.avgObjSize;
    }
    
    // Load indexes for a collection
    function loadIndexes(collectionName) {
        if (!collectionName) return;
        
        const indexes = mockIndexes[collectionName] || [];
        const tableBody = document.getElementById('indexes-table-body');
        tableBody.innerHTML = '';
        
        indexes.forEach(index => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color);">${index.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color);">${JSON.stringify(index.fields)}</td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color);">${index.type}</td>
                <td style="padding: 10px; border-bottom: 1px solid var(--border-color);">
                    <button class="drop-index" data-index="${index.name}" title="Drop Index"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Add event listeners for drop index buttons
        document.querySelectorAll('.drop-index').forEach(btn => {
            btn.addEventListener('click', function() {
                const indexName = this.getAttribute('data-index');
                if (confirm(`Are you sure you want to drop index '${indexName}'?`)) {
                    // In a real app, this would drop the index
                    const index = mockIndexes[collectionName].findIndex(i => i.name === indexName);
                    if (index > -1) {
                        mockIndexes[collectionName].splice(index, 1);
                        loadIndexes(collectionName);
                    }
                }
            });
        });
    }
    
    // Update pagination info
    function updatePagination() {
        if (!currentState.currentCollection) return;
        
        const documents = mockDocuments[currentState.currentCollection] || [];
        const totalPages = Math.ceil(documents.length / currentState.pageSize);
        
        pageInfo.textContent = `Page ${currentState.currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentState.currentPage <= 1;
        nextPageBtn.disabled = currentState.currentPage >= totalPages;
    }
    
    // Execute query button click handler
    executeQueryButton.addEventListener('click', function() {
        if (!currentState.currentCollection) {
            alert('Please select a collection first');
            return;
        }
        
        const queryText = queryInput.value.trim();
        
        try {
            // In a real app, this would be sent to your backend
            let query = {};
            if (queryText) {
                query = JSON.parse(queryText);
            }
            
            // For demo, we'll just filter our mock data
            const documents = mockDocuments[currentState.currentCollection] || [];
            const filtered = documents.filter(doc => {
                for (const key in query) {
                    if (doc[key] !== query[key]) {
                        return false;
                    }
                }
                return true;
            });
            
            mockDocuments[currentState.currentCollection] = filtered;
            loadDocuments(currentState.currentCollection);
            updatePagination();
        } catch (e) {
            alert('Invalid query: ' + e.message);
        }
    });
    
    // Pagination handlers
    prevPageBtn.addEventListener('click', function() {
        if (currentState.currentPage > 1) {
            currentState.currentPage--;
            loadDocuments(currentState.currentCollection);
            updatePagination();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        const documents = mockDocuments[currentState.currentCollection] || [];
        const totalPages = Math.ceil(documents.length / currentState.pageSize);
        
        if (currentState.currentPage < totalPages) {
            currentState.currentPage++;
            loadDocuments(currentState.currentCollection);
            updatePagination();
        }
    });
    
    // Query limit change handler
    queryLimit.addEventListener('change', function() {
        if (currentState.currentCollection) {
            loadDocuments(currentState.currentCollection);
            updatePagination();
        }
    });
    
    // Sort change handler
    querySort.addEventListener('change', function() {
        if (currentState.currentCollection) {
            loadDocuments(currentState.currentCollection);
        }
    });
    
    // Sort field change handler
    querySortField.addEventListener('change', function() {
        if (currentState.currentCollection) {
            loadDocuments(currentState.currentCollection);
        }
    });
    
    // CRUD Operations
    insertDocumentBtn.addEventListener('click', function() {
        if (!currentState.currentCollection) {
            alert('Please select a collection first');
            return;
        }
        
        modalTitle.textContent = 'Insert Document';
        jsonEditor.set({});
        documentModal.style.display = 'flex';
    });
    
    updateDocumentBtn.addEventListener('click', function() {
        if (!currentState.currentCollection) {
            alert('Please select a collection first');
            return;
        }
        
        // In a real app, you would select a document to update
        const documents = mockDocuments[currentState.currentCollection] || [];
        if (documents.length === 0) {
            alert('No documents to update');
            return;
        }
        
        modalTitle.textContent = 'Update Document';
        jsonEditor.set(documents[0]);
        documentModal.style.display = 'flex';
    });
    
    deleteDocumentBtn.addEventListener('click', function() {
        if (!currentState.currentCollection) {
            alert('Please select a collection first');
            return;
        }
        
        // In a real app, you would select a document to delete
        if (confirm('Are you sure you want to delete this document?')) {
            const documents = mockDocuments[currentState.currentCollection] || [];
            if (documents.length > 0) {
                documents.shift();
                loadDocuments(currentState.currentCollection);
                updatePagination();
            }
        }
    });
    
    // Export/Import (mock implementations)
    exportDocumentsBtn.addEventListener('click', function() {
        if (!currentState.currentCollection) {
            alert('Please select a collection first');
            return;
        }
        
        const data = JSON.stringify(mockDocuments[currentState.currentCollection], null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentState.currentCollection}.json`;
        a.click();
    });
    
    importDocumentsBtn.addEventListener('click', function() {
        if (!currentState.currentCollection) {
            alert('Please select a collection first');
            return;
        }
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    mockDocuments[currentState.currentCollection] = data;
                    loadDocuments(currentState.currentCollection);
                    updatePagination();
                } catch (err) {
                    alert('Error parsing JSON file: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });
    
    // Query builder toggle
    queryBuilderToggle.addEventListener('click', function() {
        queryBuilder.style.display = queryBuilder.style.display === 'none' ? 'block' : 'none';
    });
    
    // Apply query builder
    applyQueryBuilderBtn.addEventListener('click', function() {
        try {
            const filter = filterEditor.get();
            const projection = projectionEditor.get();
            
            queryInput.value = JSON.stringify(filter);
            documentModal.style.display = 'none';
        } catch (err) {
            alert('Error applying query: ' + err.message);
        }
    });
    
    // Create index
    createIndexBtn.addEventListener('click', function() {
        if (!currentState.currentCollection) {
            alert('Please select a collection first');
            return;
        }
        
        indexModal.style.display = 'flex';
    });
    
    // Create index modal button
    createIndexModalBtn.addEventListener('click', function() {
        try {
            const indexName = document.getElementById('index-name').value || undefined;
            const fields = indexFieldsEditor.get();
            const options = indexOptionsEditor.get();
            
            // In a real app, this would create an index
            const newIndex = {
                name: indexName || Object.keys(fields).map(k => `${k}_${fields[k]}`).join('_'),
                fields: fields,
                type: "BTREE",
                ...options
            };
            
            if (!mockIndexes[currentState.currentCollection]) {
                mockIndexes[currentState.currentCollection] = [];
            }
            
            mockIndexes[currentState.currentCollection].push(newIndex);
            loadIndexes(currentState.currentCollection);
            indexModal.style.display = 'none';
        } catch (err) {
            alert('Error creating index: ' + err.message);
        }
    });
    
    // Modal handlers
    saveModalBtn.addEventListener('click', function() {
        try {
            const doc = jsonEditor.get();
            
            // In a real app, this would save the document
            if (modalTitle.textContent === 'Insert Document') {
                if (!doc._id) {
                    doc._id = Math.random().toString(36).substr(2, 9);
                }
                mockDocuments[currentState.currentCollection].unshift(doc);
            } else {
                // Update first document for demo
                if (mockDocuments[currentState.currentCollection].length > 0) {
                    mockDocuments[currentState.currentCollection][0] = doc;
                } else {
                    mockDocuments[currentState.currentCollection].push(doc);
                }
            }
            
            loadDocuments(currentState.currentCollection);
            updatePagination();
            documentModal.style.display = 'none';
        } catch (err) {
            alert('Error saving document: ' + err.message);
        }
    });
    
    cancelModalBtn.addEventListener('click', function() {
        documentModal.style.display = 'none';
        indexModal.style.display = 'none';
    });
    
    closeModalBtn.addEventListener('click', function() {
        documentModal.style.display = 'none';
    });
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            indexModal.style.display = 'none';
        });
    });
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', function() {
        currentState.darkMode = !currentState.darkMode;
        if (currentState.darkMode) {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
    
    // Refresh databases
    refreshDatabasesBtn.addEventListener('click', function() {
        if (currentState.connected) {
            loadDatabases();
        } else {
            alert('Please connect to a server first');
        }
    });
    
    // Create database
    createDatabaseBtn.addEventListener('click', function() {
        if (!currentState.connected) {
            alert('Please connect to a server first');
            return;
        }
        
        const dbName = prompt('Enter database name:');
        if (dbName) {
            // In a real app, this would create a database
            mockDatabases[dbName] = [];
            mockDocuments[dbName] = [];
            mockIndexes[dbName] = [];
            mockStats[dbName] = { count: 0, storageSize: "0KB", indexSize: "0KB", avgObjSize: "0B" };
            loadDatabases();
        }
    });
    
    // Initialize the app
    initEditors();
    connectionStringInput.value = 'mongodb://localhost:27017';
    
    // For demo purposes, auto-connect
    setTimeout(() => {
        connectButton.click();
    }, 500);
});