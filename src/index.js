const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json()); //midwale para conseguir receber json

const customers = [] //banco de dados fake 

function verifyIfExistsAccountCPF(request, response, next){
    const { cpf } = request.headers;

    const customer = customers.find((customer)=> customer.cpf === cpf);

    if (!customer){
        return response.status(400).json({error: "Customer not found"})
    }

    request.customer = customer; //para usar esse dado nas funções a baixo

    return next();
}

function getBalance(statement){
    // reduce pega todos os valores que é passado para essa conta e transforma em um so
    // variavel acc será responsavel por acumular valor que sai e entra
    // operation é o objeto que vamos passar 
    const balance = statement.reduce((acc, operation)=>{
        if(operation.type === 'credit'){
            return acc + operation.amount
        } else {
            return acc + operation.amount
        }
    }, 0);
    //esse é o valor que ele vai iniciar

    return balance
}

app.post("/account", (request, response)=>{
    const {cpf, name} = request.body; 
    //se tratando de inserção de dados usar request.body
    // conceito de desistruturação {} para pegar dados do request

    // verificação se existe algum cpf igual ao que está sendo cadastrado /
    const customerAlreadyExists = customers.some(
        (customer)=> customer.cpf === cpf
    ); 

    //verificação se já existe cpf
    if (customerAlreadyExists){
        return response.status(400).json({error: "Customer already exists!"})
    }

    //criar um array de itens e dentro criar um objeto 
    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

    return response.status(201).send(); 
    //retornar com send pq não quer retornar nenhuma informação
    //retornado status de 201 que é quando algo foi criado 
})

// app.use(verifyIfExistsAccountCPF)

app.get("/statement", verifyIfExistsAccountCPF, (request, response)=> {
    const { customer } = request; 

    return response.json(customer.statement)
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response)=>{
    const { description, amount } = request.body;

    //verificação do cpf já está dentro do customer 
    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    };

    /* 
    * como está trabalhando com posição em memoria, 
    * códico já pega nosso customer e adiciona statment dentro 
    */
    customer.statement.push(statementOperation);

    return response.status(201).send()

})

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response)=>{
    // Pegar quantia do saque a ser realizado 
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement)

    if (balance < amount){
        return response.status(400).json({ error: "Insuficiente funds!" });
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
})

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response)=> {
    const { customer } = request; 
    const { date } = request.query; 

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        (statement)=>
            statement.created_at.toDateString() ===
            new Date(dateFormat).toDateString()
    );

    return response.json(statement)
});

app.put("/account", verifyIfExistsAccountCPF, (request, response)=>{
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send()
});

app.get("/account", verifyIfExistsAccountCPF, (request, response)=>{
    const { customer } = request;

    return response.json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (request, response)=>{
    const { customer } = request;

    customers.splice(customer, 1);

    return response.status(200).json(customers);
});

app.get("/balance", verifyIfExistsAccountCPF, (request, response)=>{
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);
});

app.listen(3333);