// scripts.js
// Import the functions you need from the SDKs you need
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyB85kPko242u5fRrX-bfoLFGmPs-6KQIgs",
//   authDomain: "anotadorperguntas.firebaseapp.com",
//   projectId: "anotadorperguntas",
//   storageBucket: "anotadorperguntas.appspot.com",
//   messagingSenderId: "991153329843",
//   appId: "1:991153329843:web:c1c134d16ff053d88302c6"
// };

// scripts.js

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
    const questionForm = document.getElementById('question-form');
    const questionInput = document.getElementById('question-input');
    const categorySelect = document.getElementById('category-select');
    const questionsList = document.getElementById('questions-list');
    const filterSelect = document.getElementById('filter-select');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameDisplay = document.getElementById('user-name-display');
    const googleLoginBtn = document.getElementById('google-login-btn');

    // Função para adicionar pergunta ao Firestore
    function addQuestionToFirestore(question, category, userId, userName) {
        db.collection('questions').add({
            question: question,
            category: category,
            userId: userId,
            userName: userName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('Pergunta adicionada com sucesso!');
        }).catch((error) => {
            console.error('Erro ao adicionar pergunta: ', error);
        });
    }

    // Função para exibir perguntas
    function displayQuestions(querySnapshot) {
        questionsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const listItem = document.createElement('li');
            listItem.textContent = `${data.userName}: ${data.question} (${data.category})`;

            // Adiciona o botão de remoção se o usuário é o dono da pergunta
            if (auth.currentUser && auth.currentUser.uid === data.userId) {
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remover';
                removeButton.addEventListener('click', () => {
                    db.collection('questions').doc(doc.id).delete().then(() => {
                        console.log('Pergunta removida com sucesso!');
                    }).catch((error) => {
                        console.error('Erro ao remover pergunta: ', error);
                    });
                });
                listItem.appendChild(removeButton);
            }

            questionsList.appendChild(listItem);
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

        if (questionText && userId) {
            addQuestionToFirestore(questionText, category, userId, userName);

            // Limpa os campos de entrada
            questionInput.value = '';
            categorySelect.value = 'Geral';
        }
    });

    // Filtrar perguntas por categoria
    filterSelect.addEventListener('change', (e) => {
        loadQuestions(e.target.value);
    });

    // Função para alternar a visibilidade dos formulários
    function toggleForms(user) {
        if (user) {
            googleLoginBtn.style.display = 'none';
            questionForm.style.display = 'block';
            logoutBtn.style.display = 'block';
            userNameDisplay.textContent = `Logado como: ${user.displayName} (${user.email})`;
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