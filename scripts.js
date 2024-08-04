// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB85kPko242u5fRrX-bfoLFGmPs-6KQIgs",
    authDomain: "anotadorperguntas.firebaseapp.com",
    projectId: "anotadorperguntas",
    storageBucket: "anotadorperguntas.appspot.com",
    messagingSenderId: "991153329843",
    appId: "1:991153329843:web:c1c134d16ff053d88302c6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {

    const themeToggle = document.getElementById('theme-toggle');
    const userTheme = localStorage.getItem('theme') || 'light';
    
    document.body.classList.toggle('dark-mode', userTheme === 'dark');
    themeToggle.checked = userTheme === 'dark';
    
    themeToggle.addEventListener('change', () => {
        const isDarkMode = themeToggle.checked;
        document.body.classList.toggle('dark-mode', isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });
    
    const questionForm = document.getElementById('question-form');
    const questionInput = document.getElementById('question-input');
    const categorySelect = document.getElementById('category-select');
    const questionsList = document.getElementById('questions-list');
    const filterSelect = document.getElementById('filter-select');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameDisplay = document.getElementById('user-name-display');
    const googleLoginBtn = document.getElementById('google-login-btn');

    // Função para adicionar pergunta ao Firestore
    function addQuestionToFirestore(question, category, userId, userName, userPhotoURL) {
        db.collection('questions').add({
            question: question,
            category: category,
            userId: userId,
            userName: userName,
            userPhotoURL: userPhotoURL,
            timestamp: firebase.firestore.FieldValue.serverTimestamp() // Armazenando o timestamp
        }).then(() => {
            console.log('Pergunta adicionada com sucesso!');
        }).catch((error) => {
            console.error('Erro ao adicionar pergunta: ', error);
        });
    }

    // Função para atualizar pergunta no Firestore
    function updateQuestionInFirestore(docId, newQuestion, newCategory) {
        db.collection('questions').doc(docId).update({
            question: newQuestion,
            category: newCategory,
            timestamp: firebase.firestore.FieldValue.serverTimestamp() // Atualizando o timestamp
        }).then(() => {
            console.log('Pergunta atualizada com sucesso!');
        }).catch((error) => {
            console.error('Erro ao atualizar pergunta: ', error);
        });
    }

    // Função para adicionar comentário ao Firestore
    function addCommentToFirestore(docId, commentText, userId, userName, userPhotoURL) {
        db.collection('questions').doc(docId).collection('comments').add({
            comment: commentText,
            userId: userId,
            userName: userName,
            userPhotoURL: userPhotoURL, // Adiciona a URL da foto do perfil
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('Comentário adicionado com sucesso!');
        }).catch((error) => {
            console.error('Erro ao adicionar comentário: ', error);
        });
    }

    // Função para exibir comentários
    function displayComments(docId, commentsList) {
        db.collection('questions').doc(docId).collection('comments')
            .orderBy('timestamp', 'asc')
            .onSnapshot((querySnapshot) => {
                commentsList.innerHTML = '';
                querySnapshot.forEach((commentDoc) => {
                    const commentData = commentDoc.data();
                    const commentItem = document.createElement('li');

                    // Criar um contêiner para o comentário
                    const commentContainer = document.createElement('div');
                    commentContainer.classList.add('comment-container');

                    // Cabeçalho do comentário
                    const commentHeader = document.createElement('div');
                    commentHeader.classList.add('comment-header');

                    // Adicionar a imagem do avatar
                    const userAvatar = document.createElement('img');
                    userAvatar.src = commentData.userPhotoURL || 'assets/defaultavatar.jpg';
                    userAvatar.alt = `${commentData.userName}'s avatar`;
                    userAvatar.classList.add('comment-avatar');

                    // Nome do usuário
                    const userName = document.createElement('span');
                    userName.textContent = commentData.userName;
                    userName.classList.add('comment-user-name');

                    // Timestamp (opcional)
                    const timestamp = commentData.timestamp ? commentData.timestamp.toDate().toLocaleString() : 'Data não disponível';
                    const commentTimestamp = document.createElement('span');
                    commentTimestamp.textContent = timestamp;
                    commentTimestamp.classList.add('comment-timestamp');

                    // Adicionar avatar, nome do usuário e timestamp ao cabeçalho
                    commentHeader.appendChild(userAvatar);
                    commentHeader.appendChild(userName);
                    commentHeader.appendChild(commentTimestamp);

                    // Adicionar o cabeçalho ao contêiner do comentário
                    commentContainer.appendChild(commentHeader);

                    // Adicionar o texto do comentário
                    const commentText = document.createElement('div');
                    commentText.classList.add('comment-text');
                    commentText.textContent = commentData.comment;

                    // Adicionar o texto ao contêiner do comentário
                    commentContainer.appendChild(commentText);

                    // Adicionar botões de edição e exclusão se o usuário é o autor do comentário
                    if (auth.currentUser && auth.currentUser.uid === commentData.userId) {
                        const buttonsContainer = document.createElement('div');
                        buttonsContainer.classList.add('comment-options');
        
                        const editButton = document.createElement('button');
                        editButton.textContent = 'Editar';
                        editButton.classList.add('edit-button');
                        editButton.addEventListener('click', () => {
                            showEditCommentForm(docId, commentDoc.id, commentData.comment);
                        });
                        buttonsContainer.appendChild(editButton);
        
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Excluir';
                        deleteButton.classList.add('remove-button');
                        deleteButton.addEventListener('click', () => {
                            deleteCommentFromFirestore(docId, commentDoc.id);
                        });
                        buttonsContainer.appendChild(deleteButton);
        
                        commentContainer.appendChild(buttonsContainer);
                    }

                    // Adicionar o contêiner do comentário ao item da lista
                    commentItem.appendChild(commentContainer);
                    commentItem.setAttribute('data-comment-id', commentDoc.id); // Adiciona o identificador do comentário

                    commentsList.appendChild(commentItem);
                });
            });
    }

    // Deletar comentário
    function deleteCommentFromFirestore(docId, commentId) {
        db.collection('questions').doc(docId).collection('comments').doc(commentId).delete()
            .then(() => {
                console.log('Comentário removido com sucesso!');
            })
            .catch((error) => {
                console.error('Erro ao remover comentário: ', error);
            });
    }
    
    // Função para Mostrar Formulário de Edição de Comentário
    function showEditCommentForm(docId, commentId, currentComment) {
        // Localizar o item da lista de comentários
        const commentItem = document.querySelector(`li[data-comment-id="${commentId}"]`);

        if (commentItem) {
            // Criar formulário de edição
            const editForm = document.createElement('form');
            editForm.classList.add('edit-comment-form');

            const editCommentTextarea = document.createElement('textarea');
            editCommentTextarea.value = currentComment;
            editCommentTextarea.rows = 4; // Número inicial de linhas

            // Ajustar dinamicamente a altura do textarea conforme o conteúdo
            editCommentTextarea.addEventListener('input', () => {
                editCommentTextarea.style.height = 'auto'; // Redefine para auto para calcular a altura necessária
                editCommentTextarea.style.height = (editCommentTextarea.scrollHeight) + 'px'; // Ajusta a altura com base no scrollHeight
            });

            const saveButton = document.createElement('button');
            saveButton.type = 'submit';
            saveButton.textContent = 'Salvar';

            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.textContent = 'Cancelar';
            cancelButton.addEventListener('click', () => {
                displayComments(docId, commentItem.parentElement); // Recarrega os comentários para restaurar a exibição original
            });

            editForm.appendChild(editCommentTextarea);
            editForm.appendChild(saveButton);
            editForm.appendChild(cancelButton);

            // Limpar o conteúdo atual do item de comentário e adicionar o formulário de edição
            commentItem.innerHTML = '';
            commentItem.appendChild(editForm);

            // Focar no textarea e ajustar sua altura
            editCommentTextarea.focus();
            editCommentTextarea.style.height = 'auto';
            editCommentTextarea.style.height = (editCommentTextarea.scrollHeight) + 'px';

            // Salvar as mudanças ao enviar o formulário
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const updatedComment = editCommentTextarea.value.trim();
                if (updatedComment) {
                    updateCommentInFirestore(docId, commentId, updatedComment);
                }
            });
        }
    }

    // Função para Atualizar Comentários no Firestore
    function updateCommentInFirestore(docId, commentId, newComment) {
        db.collection('questions').doc(docId).collection('comments').doc(commentId).update({
            comment: newComment,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('Comentário atualizado com sucesso!');
        }).catch((error) => {
            console.error('Erro ao atualizar comentário: ', error);
        });
    }

    // Função para exibir perguntas
    function displayQuestions(querySnapshot) {
        const questionsList = document.getElementById('questions-list');
        questionsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const listItem = document.createElement('li');
            listItem.setAttribute('data-doc-id', doc.id); // Adiciona o data-doc-id

            // Cabeçalho da pergunta com avatar, nome do usuário e timestamp
            const questionHeader = document.createElement('div');
            questionHeader.classList.add('question-header');

            const userAvatar = document.createElement('img');
            userAvatar.src = data.userPhotoURL || 'assets/defaultavatar.jpg';
            userAvatar.alt = `${data.userName}'s avatar`;
            userAvatar.classList.add('user-avatar');

            const userName = document.createElement('span');
            userName.textContent = data.userName;
            userName.classList.add('user-name');

            // Recuperar e formatar o timestamp
            let timestampFormatted = 'Data não disponível';
            if (data.timestamp) {
                const date = data.timestamp.toDate();
                timestampFormatted = date.toLocaleString(); // Formata a data e hora para uma string legível
            }
            const questionTimestamp = document.createElement('span');
            questionTimestamp.textContent = timestampFormatted;
            questionTimestamp.classList.add('question-timestamp');

            // Adicionar avatar, nome do usuário e timestamp ao cabeçalho
            questionHeader.appendChild(userAvatar);
            questionHeader.appendChild(userName);
            questionHeader.appendChild(questionTimestamp);

            listItem.appendChild(questionHeader);

            // Conteúdo da pergunta
            const questionContent = document.createElement('div');
            questionContent.classList.add('question-content');
            questionContent.textContent = `${data.question} (${data.category})`;

            listItem.appendChild(questionContent);

            // Adiciona o botão de remoção e edição se o usuário é o dono da pergunta
            if (auth.currentUser && auth.currentUser.uid === data.userId) {
                const buttonsContainer = document.createElement('div');
                buttonsContainer.classList.add('question-buttons');

                const editButton = document.createElement('button');
                editButton.textContent = 'Editar';
                editButton.classList.add('edit-button');
                editButton.addEventListener('click', () => {
                    showEditForm(doc.id, data.question, data.category);
                });
                buttonsContainer.appendChild(editButton);

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remover';
                removeButton.classList.add('remove-button');
                removeButton.addEventListener('click', () => {
                    db.collection('questions').doc(doc.id).delete().then(() => {
                        console.log('Pergunta removida com sucesso!');
                    }).catch((error) => {
                        console.error('Erro ao remover pergunta: ', error);
                    });
                });
                buttonsContainer.appendChild(removeButton);

                listItem.appendChild(buttonsContainer);
            }

            // Adiciona seção de comentários apenas se o usuário estiver logado
            if (auth.currentUser) {
                const commentsSection = document.createElement('div');
                commentsSection.classList.add('comments-section');
                const commentsList = document.createElement('ul');
                const commentInput = document.createElement('textarea');
                commentInput.type = 'text';
                commentInput.placeholder = 'Digite seu comentário...';
                // Ajustar dinamicamente a altura do textarea
                commentInput.addEventListener('input', () => {
                    commentInput.style.height = 'auto';
                    commentInput.style.height = (commentInput.scrollHeight) + 'px';
                });
                const commentButton = document.createElement('button');
                commentButton.textContent = 'Comentar';
                commentButton.classList.add('comment-button');

                // Dentro da função de adição de comentário
                commentButton.addEventListener('click', () => {
                    const commentText = commentInput.value.trim();
                    if (commentText) {
                        const userPhotoURL = auth.currentUser ? auth.currentUser.photoURL : 'assets/defaultavatar.jpg';
                        addCommentToFirestore(doc.id, commentText, auth.currentUser.uid, auth.currentUser.displayName, userPhotoURL);
                        commentInput.value = '';
                    }
                });

                commentsSection.appendChild(commentsList);
                commentsSection.appendChild(commentInput);
                commentsSection.appendChild(commentButton);
                listItem.appendChild(commentsSection);

                // Exibe comentários
                displayComments(doc.id, commentsList);
            }

            questionsList.appendChild(listItem);
        });
    }

    // Função para mostrar o formulário de edição
    function showEditForm(docId, currentQuestion, currentCategory) {
        const editForm = document.createElement('form');
        const editQuestionInput = document.createElement('input');
        editQuestionInput.type = 'text';
        editQuestionInput.value = currentQuestion;
    
        const editCategorySelect = document.createElement('select');
        ['Geral', 'Antigo Testamento', 'Novo Testamento', 'Doutrina', 'Outros'].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            if (category === currentCategory) {
                option.selected = true;
            }
            editCategorySelect.appendChild(option);
        });
    
        const saveButton = document.createElement('button');
        saveButton.type = 'submit';
        saveButton.textContent = 'Salvar';
    
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.textContent = 'Cancelar';
        cancelButton.addEventListener('click', () => {
            loadQuestions(); // Recarrega as perguntas para restaurar a exibição original
        });
    
        editForm.appendChild(editQuestionInput);
        editForm.appendChild(editCategorySelect);
        editForm.appendChild(saveButton);
        editForm.appendChild(cancelButton);
    
        // Encontrar o listItem correspondente pelo docId e substituir pelo formulário de edição
        const listItem = questionsList.querySelector(`li[data-doc-id="${docId}"]`);
        if (listItem) {
            listItem.innerHTML = ''; // Limpa o conteúdo atual do listItem
            listItem.appendChild(editForm);
        }
    
        // Submeter a atualização da pergunta
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newQuestion = editQuestionInput.value.trim();
            const newCategory = editCategorySelect.value;
    
            if (newQuestion) {
                updateQuestionInFirestore(docId, newQuestion, newCategory);
                loadQuestions(); // Recarrega as perguntas após a atualização
            }
        });
    }

    // Carregar perguntas do Firestore e aplicar filtro
    function loadQuestions(categoryFilter = 'Todas') {
        let query = db.collection('questions').orderBy('timestamp', 'desc');
        if (categoryFilter !== 'Todas') {
            query = query.where('category', '==', categoryFilter);
        }
        query.onSnapshot((querySnapshot) => {
            displayQuestions(querySnapshot);
        });
    }

    // Adicionar uma nova pergunta
    questionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const questionText = questionInput.value.trim();
        const category = categorySelect.value;
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        const userName = auth.currentUser ? auth.currentUser.displayName : 'Anônimo';
        const userPhotoURL = auth.currentUser ? auth.currentUser.photoURL : 'default-avatar.png';

        if (questionText && userId) {
            addQuestionToFirestore(questionText, category, userId, userName, userPhotoURL);

            // Limpa os campos de entrada
            questionInput.value = '';
            categorySelect.value = 'Geral';
        }
    });

    // Filtrar perguntas por categoria
    filterSelect.addEventListener('change', (e) => {
        loadQuestions(e.target.value);
    });

    // Atualização no toggleForms para incluir userPhotoURL
    function toggleForms(user) {
        if (user) {
            googleLoginBtn.style.display = 'none';
            questionForm.style.display = 'block';
            logoutBtn.style.display = 'block';
            userNameDisplay.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName}'s avatar" class="user-avatar"> Logado como: ${user.displayName} (${user.email})`;
        } else {
            googleLoginBtn.style.display = 'block';
            questionForm.style.display = 'none';
            logoutBtn.style.display = 'none';
            userNameDisplay.textContent = '';
        }
    }

    // Login com Google
    googleLoginBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then((result) => {
                toggleForms(result.user);
                console.log('Usuário logado:', result.user);
            })
            .catch((error) => {
                console.error('Erro ao fazer login com Google:', error);
            });
    });

    // Logout do usuário
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                toggleForms(null);
                console.log('Usuário deslogado');
            })
            .catch((error) => {
                console.error('Erro ao fazer logout:', error);
            });
    });

    // Observar mudanças de autenticação
    auth.onAuthStateChanged((user) => {
        toggleForms(user);
        if (user) {
            loadQuestions();
        }
    });

    // Carregar todas as perguntas ao inicializar
    loadQuestions();
});
