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

document.addEventListener('DOMContentLoaded', () => {
    const questionForm = document.getElementById('question-form');
    const userNameInput = document.getElementById('user-name');
    const questionInput = document.getElementById('question-input');
    const categorySelect = document.getElementById('category-select');
    const questionsList = document.getElementById('questions-list');
    const filterSelect = document.getElementById('filter-select');

    // Função para adicionar pergunta ao Firestore
    function addQuestionToFirestore(name, question, category) {
        db.collection('questions').add({
            name: name,
            question: question,
            category: category,
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
            listItem.textContent = `${data.name}: ${data.question} (${data.category})`;

            // Adiciona o botão de remoção
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

        const userName = userNameInput.value.trim();
        const questionText = questionInput.value.trim();
        const category = categorySelect.value;

        if (userName && questionText) {
            addQuestionToFirestore(userName, questionText, category);

            // Limpa os campos de entrada
            userNameInput.value = '';
            questionInput.value = '';
            categorySelect.value = 'Geral';
        }
    });

    // Filtrar perguntas por categoria
    filterSelect.addEventListener('change', (e) => {
        loadQuestions(e.target.value);
    });

    // Carregar todas as perguntas ao inicializar
    loadQuestions();
});