const express = require('express');
var pg = require('pg');

var sw = express();

sw.use(express.json());

sw.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    next();
});

const config = {
    host: 'localhost',
    user: 'postgres',
    database: 'moda_festa_BD',
    password: 'postgres',
    port: 5435 //5432 5435
};

//definia conexao com o banco de dados.
const postgres = new pg.Pool(config);

//definicao do primeiro serviço web.
sw.get('/', (req, res) => {
    res.send('Ola Mundo primeiro teste');
})
sw.post('/login', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send('{' + err + '}');
        } else {
            var q = {
                text: 'select cpf, tipo, to_char(data_cadastro, \'yyyy-mm-dd\') as data_cadastro from pessoas where cpf = $1 and password = $2 and tipo = $3;',
                values: [req.body.cpf, req.body.password, req.body.tipo]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 pelo login: ' + err.message);
                    res.status(400).send('{' + err + '}');
                } else {

                    if (result.rows.length > 0) {

                        
                            console.log('retornou 201 pelo login');
                            res.status(201).send({ "cpf": req.body.cpf, " tipo": req.body.tipo, 'data_cadastro': result.rows[0].data_cadastro });

                    }else{
                        console.log('retornou 204 pelo login: '+ err);
                        res.status(204).send('{' + err + '}');
                    }
                }
            })
        }
    })
})
sw.get('/cliente/:cpf', function (req, res) {

    //estabelece uma conexao com o bd.
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send('{' + err + '}');
        } else {
         
            var q = {
                text: 'SELECT  p.cpf, p.nome, p.email, p.telefone, p.cep, ' +
                    'p.logradouro, p.bairro, p.numero, p.complemento, p.observacoes, ' +
                    'to_char(p.data_cadastro, \'yyyy-mm-dd\') as data_cadastro, ' +
                    'p.username, p.password, ' +
                    'to_char(p.data_ultimo_login, \'yyyy-mm-dd\') as data_ultimo_login, p.tipo, ' +
                    'c.rg,c.cnpj, c.ie, c.tipo ' +
                    'FROM pessoas p inner join clientes c on (p.cpf=c.cpf_pessoa) ' +
                    'where cpf = $1 order by p.cpf asc;',
                values: [req.params.cpf]
            }
            client.query(q, async function (err, result) {

                if (err) {
                    console.log(err);
                    res.status(500).send('{' + err + '}');
                } else {

                    done();
                    res.status(200).send({
                        "cpf": result.rows[0].cpf,
                        "nome": result.rows[0].nome,
                        "email": result.rows[0].email,
                        "telefone": result.rows[0].telefone,
                        "cep": result.rows[0].cep,
                        "data_cadastro": result.rows[0].data_cadastro,
                        "logradouro": result.rows[0].logradouro,
                        "bairro": result.rows[0].bairro,
                        "numero": result.rows[0].numero,
                        "complemento": result.rows[0].complemento,
                        "observacoes": result.rows[0].observacoes,
                        "username": result.rows[0].username,
                        "password": result.rows[0].password,
                        "data_ultimo_login": result.rows[0].data_ultimo_login,
                        "tipo": result.rows[0].tipo,
                        "cliente": {
                            "rg": result.rows[0].rg,
                            "cnpj": result.rows[0].cnpj,
                            "ie": result.rows[0].ie,
                            "tipo": result.rows[0].tipo
                        }
                    })


                }

            })
        }
    })
})


sw.get('/listcliente', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o DB :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query('SELECT p.cpf, p.nome, p.email, p.telefone, p.cep, ' +
                'p.logradouro, p.bairro, p.numero, p.complemento, p.observacoes, ' +
                'p.data_cadastro, ' +
                'to_char(p.data_cadastro, \'yyyy-mm-dd\') as data_cadastro, ' +
                'p.username, p.password, ' +
                ' to_char(p.data_ultimo_login, \'yyyy-mm-dd\') as data_ultimo_login, p.tipo, ' +
                'c.rg, c.cnpj, c.ie, c.tipo ' +
                'FROM pessoas p inner join clientes c on (p.cpf=c.cpf_pessoa) ' +
                'order by p.cpf asc;', function (err, result) {
                    done();
                    if (err) {
                        console.log(err);
                        res.status(400).send(`{${err}}`);
                    } else {
                        res.status(200).send(result.rows);
                    }
                });
        }
    });
});

sw.get('/deletecliente/:cpf', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não coseguiu acessar o BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q1 = {
                text: `delete from clientes where cpf_pessoa = $1`,
                values: [req.params.cpf]
            }
            var q2 = {
                text: `delete FROM pessoas where cpf = $1`,
                values: [req.params.cpf]
            }

        }
        client.query(q1, function (err, result) {

            if (err) {
                console.log("retorno 400 no deletecliente q1: "+err.message);
                res.status(400).send(`{${err.message}}`);
            } else {
                client.query(q2, function (err, result) {
                    done(); // closing the connection;
                    if (err) {
                        console.log("retorno 400 no deletecliente q2: "+err.message);
                        res.status(400).send(`{${err.message}}`);
                    } else {
                        console.log("retorno 200 no deletecliente")
                        res.status(200).send({ 'cpf': req.params.cpf }) //retorna o id deletado 

                    }
                })


            }
        })
    });
});

sw.post('/insertcliente', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não coseguiu acessar o BD " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q1 = {
                text: 'insert into pessoas (cpf, nome, email, telefone, cep, logradouro, bairro, numero, complemento,observacoes, data_cadastro, username, password, data_ultimo_login, tipo) ' +
                    'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), $11, $12, now(), $13) ' +
                    'returning cpf, nome, email, telefone, cep, ' +
                    'logradouro, bairro, numero, complemento, observacoes, ' +
                    'to_char(data_cadastro, \'yyyy-mm-dd\') as data_cadastro, ' +
                    'username, cpf, password, ' +
                    'to_char(data_ultimo_login, \'yyyy-mm-dd\') as data_ultimo_login, tipo ',
                values: [
                    req.body.cpf,
                    req.body.nome,
                    req.body.email,
                    req.body.telefone,
                    req.body.cep,
                    req.body.logradouro,
                    req.body.bairro,
                    req.body.numero,
                    req.body.complemento,
                    req.body.observacoes,
                    req.body.username,
                    req.body.password,
                    req.body.tipo == true ? "C" : "F"
                ]
            }


            console.log(q1);

            var q2 = {
                text: `insert into clientes (rg, cnpj, ie, cpf_pessoa, tipo) values ($1, $2, $3, $4, $5) returning  rg, cnpj, ie, tipo;`,
                values: [
                    req.body.cliente.rg,
                    req.body.cliente.cnpj,
                    req.body.cliente.ie,
                    req.body.cpf,
                    req.body.cliente.tipo == true ? "F" : "J",


                ]
            }

            console.log(q2);

            client.query(q1, function (err, result1) {


                if (err) {
                    console.log('retornou 400 no insert q1: ' + err.message);
                    res.status(400).send(`{${err}}`);

                } else {
                    client.query(q2, function (err, result2) {
                        if (err) {
                            console.log('retornou 400 no insert q2:' + err.message);
                            res.status(400).send(`{${err}}`);
                        } else {
                            done(); // closing the connection;
                            console.log(`retornou 201 no insertcliente`)
                            res.status(201).send({
                                "cpf": result1.rows[0].cpf,
                                "nome": result1.rows[0].nome,
                                "email": result1.rows[0].email,
                                "telefone": result1.rows[0].telefone,
                                "cep": result1.rows[0].cep,
                                "logradouro": result1.rows[0].logradouro,
                                "bairro": result1.rows[0].bairro,
                                "numero": result1.rows[0].numero,
                                "complemento": result1.rows[0].complemento,
                                "observacoes": result1.rows[0].observacoes,
                                "username": result1.rows[0].username,
                                "password": result1.rows[0].password,
                                "tipo": result1.rows[0].tipo,
                                "cliente": {
                                    "rg": result2.rows[0].rg,
                                    "cnpj": result2.rows[0].cnpj,
                                    "ie": result2.rows[0].ie,
                                    "tipo": result2.rows[0].tipo

                                }
                            })
                        }
                    });
                }

            });
        }
    });

});
sw.post('/updatecliente', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`)
        } else {

            var q1 = {
                text: 'update pessoas set nome=$2, email=$3, telefone=$4, cep=$5, ' +
                    'logradouro=$6, bairro=$7, numero=$8, complemento=$9, observacoes = $10, ' +
                    'username=$11, password=$12, tipo=$13 where cpf=$1 ' +
                    'returning nome, email, telefone, cep, logradouro, bairro, numero, complemento, observacoes, username, password, tipo, ' +
                    'to_char(data_cadastro, \'yyyy-mm-dd\') as data_cadastro, ' +
                    'username, password, ' +
                    'to_char(data_ultimo_login, \'yyyy-mm-dd\') as data_ultimo_login, tipo',
                values: [
                    req.body.cpf,
                    req.body.nome,
                    req.body.email,
                    req.body.telefone,
                    req.body.cep,
                    req.body.logradouro,
                    req.body.bairro,
                    req.body.numero,
                    req.body.complemento,
                    req.body.observacoes,
                    req.body.username,
                    req.body.password,
                    req.body.tipo == true ? "C" : "F"


                ]
            }


            console.log(q1);


            client.query(q1, function (err, result1) {
                var q2 = {
                    text: `update clientes set rg=$1, cnpj=$2, ie=$3, tipo = $5 where cpf_pessoa=$4 
                           returning rg, cnpj, ie, cpf_pessoa, tipo `,
                    values: [

                        req.body.cliente.rg,
                        req.body.cliente.cnpj,
                        req.body.cliente.ie,
                        req.body.cpf,
                        req.body.cliente.tipo == true ? "F" : "J",

                    ]

                }
                console.log(q2);
                if (err) {
                    console.log(err);
                    res.status(400).send(`mensagem erro q1: {${err.message}}`);

                } else {
                    client.query(q2, function (err, result2) {
                        if (err) {
                            console.log('retornou 400 no update');
                            console.log(err)
                            res.status(400).send(`mensagem erro q2: {${err.message}}`)
                        } else {
                            done(); // closing the connection;

                            console.log('retornou 201 no updatecliente');
                            res.status(201).send({
                                "cpf": result1.rows[0].cpf,
                                "nome": result1.rows[0].nome,
                                "email": result1.rows[0].email,
                                "telefone": result1.rows[0].telefone,
                                "cep": result1.rows[0].cep,
                                "logradouro": result1.rows[0].logradouro,
                                "bairro": result1.rows[0].bairro,
                                "numero": result1.rows[0].numero,
                                "complemento": result1.rows[0].complemento,
                                "observacoes": result1.rows[0].observacoes,
                                "data_cadastro": result1.rows[0].data_cadastro,
                                "username": result1.rows[0].username,
                                "password": result1.rows[0].password,
                                "data_ultimo_login": result1.rows[0].data_ultimo_login,
                                "tipo": result1.rows[0].tipo,
                                "cliente": {
                                    "rg": result2.rows[0].rg,
                                    "cnpj": result2.rows[0].cnpj,
                                    "ie": result2.rows[0].ie,
                                    "tipo": result2.rows[0].tipo

                                }
                            });
                        }
                    });
                }
            });
        }
    });
});
sw.get('/funcionario/:cpf', function (req, res) {

    //estabelece uma conexao com o bd.
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send('{' + err + '}');
        } else {
            console.log(req.params.cpf)
            var q = {
                text: 'SELECT p.cpf, p.nome, p.email, p.telefone, p.cep, ' +
                    'p.logradouro, p.bairro, p.numero, p.complemento, p.observacoes, ' +
                    'to_char(p.data_cadastro, \'yyyy-mm-dd\') as data_cadastro, ' +
                    'p.username, p.password, ' +
                    'to_char(p.data_ultimo_login, \'yyyy-mm-dd\') as data_ultimo_login, p.tipo, ' +
                    'f.numero_ctps, to_char(f.data_contratacao, \'yyyy-mm-dd\') as data_contratacao, to_char(f.data_demissao, \'yyyy-mm-dd\') as data_demissao, f.perfil ' +
                    'FROM pessoas p inner join funcionarios f on (p.cpf=f.cpf_pessoa) ' +
                    'where cpf = $1 order by p.cpf asc;',
                values: [req.params.cpf]
            }
            client.query(q, async function (err, result) {

                if (err) {
                    console.log(err);
                    res.status(500).send('erro funcionario: {' + err.message + '}');
                } else {

                    done();
                    res.status(200).send({
                        "cpf": result.rows[0].cpf,
                        "nome": result.rows[0].nome,
                        "email": result.rows[0].email,
                        "telefone": result.rows[0].telefone,
                        "cep": result.rows[0].cep,
                        "data_cadastro": result.rows[0].data_cadastro,
                        "logradouro": result.rows[0].logradouro,
                        "bairro": result.rows[0].bairro,
                        "numero": result.rows[0].numero,
                        "complemento": result.rows[0].complemento,
                        "observacoes": result.rows[0].observacoes,
                        "username": result.rows[0].username,
                        "password": result.rows[0].password,
                        "data_ultimo_login": result.rows[0].data_ultimo_login,
                        "tipo": result.rows[0].tipo,
                        "funcionario": {
                            "numero_ctps": result.rows[0].numero_ctps,
                            "data_contratacao": result.rows[0].data_contratacao,
                            "data_demissao": result.rows[0].data_demissao,
                            "perfil": result.rows[0].perfil,
                            

                        }
                    })


                }

            })
        }
    })
})
sw.get('/listfuncionario', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o DB :" + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            client.query('SELECT p.cpf, p.nome, p.email, p.telefone, p.cep, ' +
                'p.logradouro, p.bairro, p.numero, p.complemento, p.observacoes, ' +
                'p.data_cadastro, ' +
                'to_char(p.data_cadastro, \'yyyy-mm-dd\') as data_cadastro, ' +
                'p.username, p.password, ' +
                'to_char(p.data_ultimo_login, \'yyyy-mm-dd\') as data_ultimo_login, p.tipo, ' +
                'f.numero_ctps,to_char(f.data_contratacao, \'yyyy-mm-dd\') as data_contratacao, to_char(f.data_demissao, \'yyyy-mm-dd\') as data_demissao, f.perfil ' +
                'FROM pessoas p inner join funcionarios f on (p.cpf=f.cpf_pessoa) ' +
                'order by p.cpf asc;', function (err, result) {
                    done(); // closing the connection;
                    if (err) {
                        console.log("retornou 400 no listfuncionario"+err.message);
                        res.status(400).send(`{${err.message}}`);
                    } else {
                        console.log("retornou 200 no listfuncionario")
                        res.status(200).send(result.rows);
                    }
                });
        }
    });
});
sw.get('/deletefuncionario/:cpf', function (req, res) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não consequiu acessar o banco de dados!");
        } else {
            var q1 = {
                text: `delete from funcionarios where cpf_pessoa = $1`,
                values: [req.params.cpf]
            }
            var q2 = {
                text: `delete FROM pessoas where cpf = $1`,
                values: [req.params.cpf]
            }
        }
        client.query(q1, function (err, result) {

            if (err) {
                console.log(err);
                res.status(400).send(`{${err}}`)
            } else {
                client.query(q2, function (err, result) {
                    done(); // closing the connection;
                    if (err) {
                        console.log(err);
                        res.status(400).send(`{${err}}`);
                    } else {
                        res.status(200).send({ 'id': req.params.id }) //retorna o id deletado
                    }
                });
            }
        });
    })
});
sw.post('/insertfuncionario', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Nao conseguiu acessar o  BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q1 = {
                text: 'insert into pessoas (cpf, nome, email, telefone, cep, logradouro, bairro, numero, complemento, observacoes, data_cadastro, username, password, data_ultimo_login, tipo) ' +
                    'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), $11, $12, now(), $13) ' +
                    'returning nome, email, telefone, cep, ' +
                    'logradouro, bairro, numero, complemento, observacoes, ' +
                    'to_char(data_cadastro, \'yyyy-mm-dd\') as data_cadastro, ' +
                    'username, password, ' +
                    'to_char(data_ultimo_login, \'yyyy-mm-dd\') as data_ultimo_login ',
                values: [
                    req.body.cpf,
                    req.body.nome,
                    req.body.email,
                    req.body.telefone,
                    req.body.cep,
                    req.body.logradouro,
                    req.body.bairro,
                    req.body.numero,
                    req.body.complemento,
                    req.body.observacoes,
                    req.body.username,
                    req.body.password,
                    req.body.tipo == true ? "C" : "F"

                ]
            }
            var q2 = {
                text: 'insert into funcionarios (numero_ctps, data_contratacao, data_demissao, perfil, cpf_pessoa) ' +
                    'values($1, now(), now(), $2, $3) ' +
                    'returning numero_ctps, ' +
                    'to_char(data_contratacao, \'yyyy-mm-dd\') as data_contratacao, ' +
                    'to_char(data_demissao, \'yyyy-mm-dd\') as data_demissao, perfil',
                values: [
                    req.body.numero_ctps,
                    req.body.perfil.id,
                    req.body.cpf

                ]
            }
            console.log(q1);

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no insertfuncionario q1: '+ err.message);
                    res.status(400).send(`erro funcionario q1: {${err.message}}`);
                } else {
                    client.query(q2, function (err, result2) {
                        if (err) {
                            console.log('retornou 400 no  insertfuncionario q2: '+err.message);
                            res.status(400).send(`erro funcionario q2: {${err.message}}`);
                        } else {
                            done(); // closing the connection;
                            console.log('retornou 201 no insertfuncionario');
                            res.status(201).send({
                                "cpf": result1.rows[0].cpf,
                                "nome": result1.rows[0].nome,
                                "email": result1.rows[0].email,
                                "telefone": result1.rows[0].telefone,
                                "cep": result1.rows[0].cep,
                                "logradouro": result1.rows[0].logradouro,
                                "bairro": result1.rows[0].bairro,
                                "numero": result1.rows[0].numero,
                                "complemento": result1.rows[0].complemento,
                                "observacoes": result1.rows[0].observacoes,
                                "data_cadastro": result1.rows[0].data_cadastro,
                                "username": result1.rows[0].username,
                                "cpf": result1.rows[0].cpf,
                                "password": result1.rows[0].password,
                                "data_ultimo_login": result1.rows[0].data_ultimo_login,
                                "tipo": result1.rows[0].tipo,
                                "funcionario": {
                                    "numero_ctps": result2.rows[0].numero_ctps,
                                    "data_contratacao": result2.rows[0].data_contratacao,
                                    "data_demissao": result2.rows[0].data_demissao,
                                    "perfil": result2.rows[0].perfil,
                                    "cpf_pessoa": result2.rows[0].cpf_pessoa
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})

sw.post('/updatefuncionario', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Nao conseguiu acessar o  BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q1 = {
                text: 'update pessoas set nome=$2, email=$3, telefone=$4, cep=$5, ' +
                    'logradouro=$6, bairro=$7, numero=$8, complemento=$9, observacoes = $10, ' +
                    'username=$11, password=$12, tipo=$13 where cpf=$1 ' +
                    'returning cpf, nome, email, telefone, cep, ' +
                    'logradouro, bairro, numero, complemento, observacoes, ' +
                    'to_char(data_cadastro, \'yyyy-mm-dd\') as data_cadastro, ' +
                    'username, password, ' +
                    'to_char(data_ultimo_login, \'yyyy-mm-dd\') as data_ultimo_login, tipo',
                values: [
                    req.body.cpf,
                    req.body.nome,
                    req.body.email,
                    req.body.telefone,
                    req.body.cep,
                    req.body.logradouro,
                    req.body.bairro,
                    req.body.numero,
                    req.body.complemento,
                    req.body.observacoes,
                    req.body.username,
                    req.body.password,
                    req.body.tipo == true ? "C" : "F"

                ]
            }
            var q2 = {
                text: 'update funcionarios set numero_ctps=$1 , perfil=$2 where cpf_pessoa=$3  ' +
                    'returning numero_ctps, ' +
                    'to_char(data_contratacao, \'yyyy-mm-dd\') as data_contratacao, ' +
                    'to_char(data_demissao, \'yyyy-mm-dd\') as data_demissao, ' +
                    'perfil ',
                values: [
                    req.body.funcionario.numero_ctps,
                    req.body.funcionario.perfil,
                    req.body.cpf
                ]
            }
            console.log(q1);
            console.log(q2);

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no updatefuncionario: q1');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    client.query(q2, function (err, result2) {
                        if (err) {
                            console.log('retornou 400 no updatefuncionario q2');
                            console.log(err.message);                
                            res.status(400).send(`{${err.message}}`);
                        } else {

                            done();

                            console.log('retornou 201 no updatefuncionario');
                            res.status(201).send({
                                "cpf": result1.rows[0].cpf,
                                "nome": result1.rows[0].nome,
                                "email": result1.rows[0].email,
                                "telefone": result1.rows[0].telefone,
                                "cep": result1.rows[0].cep,
                                "logradouro": result1.rows[0].logradouro,
                                "bairro": result1.rows[0].bairro,
                                "numero": result1.rows[0].numero,
                                "complemento": result1.rows[0].complemento,
                                "observacoes": result1.rows[0].observacoes,
                                "data_cadastro": result1.rows[0].data_cadastro,
                                "username": result1.rows[0].username,
                                "password": result1.rows[0].password,
                                "data_ultimo_login": result1.rows[0].data_ultimo_login,
                                "tipo": result1.rows[0].tipo,
                                "funcionario": {
                                    "numero_ctps": result2.rows[0].numero_ctps,
                                    "data_contratacao": result2.rows[0].data_contratacao,
                                    "data_demissao": result2.rows[0].data_demissao,
                                    "perfil": result2.rows[0].perfil,
                              
                                }
                            })
                        }
                    })


                }
            })
        }

    })
})

sw.get('/perfil/:id', function (req, res) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'select p.id, p.descricao,  0 as funcionalidades from perfis p where id = $1 order by p.descricao asc;',
                values: [req.params.id]
            }
            var q2 = {
                text: 'select f.id, f.descricao from funcionalidades f, perfis_funcionalidades pf where pf.id_funcionalidade = f.id and pf.id_perfil = $1',
                values: [req.params.id]
            }

            client.query(q, async function (err, result) {
                if (err) {
                    console.log("retornou 500 no perfil q1: "+err.message);
                    res.status(500).send(`{${err}}`);
                } else {
                    client.query(q2, async function (err, result1) {
                        if (err) {
                            console.log("retornou 500 no perfil q2: "+err.message);
                            res.status(500).send(`{${err.message}}`)
                        } else {
                            done();
                            console.log("retornou 200 no perfil")
                            res.status(200).send({
                                "id": result.rows[0].id,
                                "descricao": result.rows[0].descricao,
                                "funcionalidades": result1.rows
                            })
                        }

                    })

                }
            })



        }
    });

});
/*sw.get('/perfil/:id', function (req, res) {

    //estabelece uma conexao com o bd.
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send('{' + err + '}');
        } else {
            var q = {
                text: 'SELECT p.id, p.descricao, 0 as funcionalidades from perfis p where id = $1 order by p.descricao asc ',          
                values: [req.params.id]
            }
            client.query(q, async function (err, result) {

                if (err) {
                    console.log(err);
                    res.status(500).send('{' + err + '}');
                } else {

                    done();
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "Descricao": result.rows[0].descricao,
                        "Funcionalidades": result.rows

                    })


                }

            })
        }
    })
})*/
sw.get('/listperfil', function (req, res) {

    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o BD :" + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {

            client.query('select p.id, p.descricao, 0 as funcionalidades from perfis p order by id asc;', async function (err, result) {

                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    try {
                        for (var i = 0; i < result.rows.length; i++) {

                            try {
    
                                pf = await client.query('select f.id, f.descricao from funcionalidades f, perfis_funcionalidades pf where pf.id_funcionalidade = f.id and pf.id_funcionalidade = $1', [result.rows[i].id])
    
                                result.rows[i].funcionalidades = pf.rows;
    
                            } catch (err) {
                                console.log("retornou 400 no listperfil no for perfis_funcionalidades: "+err)
                                res.status(400).send(`{${err}}`)
                            }
    
                        }
                        
                    } catch (error) {
                        console.log("retornou 400 no listperfil na tabela perfis_funcionalidades: "+err)
                        res.status(400).send(`{${err}}`)
                    }
                    
                    done();
                    console.log("retornou 200 no listperfil")
                    res.status(200).send(result.rows);
                }
            })

        }
    })
});

sw.post('/insertperfil', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: 'insert into perfis (descricao) values($1) returning id, descricao',
                values: [req.body.descricao]
            }
            console.log(q);

            client.query(q, async function (err, result) {

                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    console.log("erro perfil funcionalidade: " + err.message)
                    res.status(400).send(`{${err}}`);
                } else {
                   
                    try {
                        for (let index = 0; index < req.body.funcionalidades.length; index++) {

                                console.log(index)
    
                                await client.query('insert into perfis_funcionalidades (id_funcionalidade, id_perfil) values($1, $2)',
                                    [
    
                                        req.body.funcionalidades[index].id, req.body.id
                                    ])
    
    
                          
    
                        }
                        
                    } catch (err) {
                        console.log("retornou 400 no insertperfil no for perfis_funcionalidades: "+err)
                        res.status(400).send(`{${err}}`);
                    }
                    
                    done();
                    console.log('retornou 201 no insertperfil');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "descricao": result.rows[0].descricao,
                        "funcionalidades": req.body.funcionalidades


                    });
                }


            });

        }
    });
});
sw.post('/updateperfil', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {

            var q = {
                text: 'update perfis set descricao=$1 where id =$2 ' +
                    'returning id, descricao;',
                values: [req.body.descricao, req.body.id]
            }

        }
        console.log(q);
        client.query(q, async function (err, result) {

            if (err) {
                console.log("Erro no updateperfil: " + err.message);
                res.status(400).send(`{${err.message}}`);
            } else {

                try {

                    await client.query('delete from perfis_funcionalidades pf where pf.id_perfil = $1 ',
                        [req.body.id])
                    for (let index = 0; index < req.body.funcionalidades.length; index++) {

                        try {

                            await client.query('insert into perfis_funcionalidades (id_funcionalidade, id_perfil) values ($1, $2) ',
                                [req.body.funcionalidades[index].id, result.rows[0].id])

                        } catch (err) {
                            console.log("retornou 400 no updateperfil no for perfis_funcionalidades")
                            res.status(400).send(`{${err}}`);
                        }

                    }
                } catch (err) {
                    console.log("retornou 400 no updateperfil na tabela perfis_funcionalidades")
                    res.status(400).send(`{${err}}`);
                }

                done();

                console.log('retornou 201 no updateperfil');
                res.status(201).send({
                    "id": result.rows[0].id,
                    "descricao": result.rows[0].descricao,
                    "funcionalidade": req.body.funcionalidades
                });
            }

        });
    });
});

sw.get('/deleteperfil/:id', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "+ err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q1 = {
                text: 'delete FROM perfis_funcionalidades where id_perfil = $1',
                values: [req.params.id]
            }
            var q2 = {
                text: 'delete FROM perfis where id = $1',
                values: [req.params.id]
            }



            client.query(q1, function (err, result) {

                if (err) {
                    console.log("retornou 400 no deleteperfil q1: "+err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    client.query(q2, function (err, result) {
                        done();
                        if (err) {
                            console.log("retornou 400 no deleteperfil q2: "+err.message);
                            res.status(400).send(`{${err}}`);
                        } else {
                            console.log("retornou 200 no deleteperfil")
                            res.status(200).send({ 'id': req.params.id });
                        }
                    })
                }
            });
        }
    });
});


sw.get('/funcionalidade/:id', function (req, res) {

    //estabelece uma conexao com o bd.
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o BD :" + err.message);
            res.status(400).send('{' + err.message + '}');
        } else {
            var q = {
                text: 'SELECT f.id, f.descricao ' +
                    'FROM funcionalidades f ' +
                    'where id = $1 order by f.id asc;',
                values: [req.params.id]
            }
            client.query(q, async function (err, result) {

                if (err) {
                    console.log("retornou 400 no funcionalidade: "+ err.message);
                    res.status(400).send('erro mensage: {' + err.message + '}');
                } else {

                    done();
                    console.log("retornou 200 no funcionalidade")
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "descricao": result.rows[0].descricao,


                    })


                }

            })
        }
    })
})
sw.get('/listfuncionalidade', function (req, res, next) {
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Nao conseguiu acessar o  BD :" + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            client.query('select id, descricao from funcionalidades order by id asc;', function (err, result) {
              
                if (err) {
                    console.log("retornou 400 no listfuncionalidade: "+err.message);
                    res.status(400).send(`erro mensage: {${err.message}}`);
                } else {
                    done();
                    console.log("retornou 200 no listfuncionalidade");
                    res.status(200).send(result.rows)
                }
            })

        }
    })
})


sw.post('/insertfuncionalidade', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nõa conseguiu acessar o BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {

            var q = {
                text: 'insert into funcionalidades (descricao) values($1) returning descricao',
                values: [req.body.descricao]
            }
            console.log(q);

            client.query(q, function (err, result) {
              
                if (err) {
                    console.log('retornou 400 no insertfuncionalidade');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    done();
                    console.log('retornou 201 no insertfuncionalidade');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "Descricao": result.rows[0].descricao
                    });
                }
            });
        }
    });
});

sw.post('/updatefuncionalidade', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Não conseguiu acessar o BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {

            var q = {
                text: 'update funcionalidades set descricao=$1 where id = $2',
                values: [req.body.descricao, req.body.id]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {

                    console.log("retornou 400 no updatefuncionalidade: " + err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    console.log("retornou 200 no updatefuncionalidade")
                    res.status(200).send(req.body)
                   /*res.status(200).send({
                        "id": result.rows[0].id,
                        "Descricao": result.rows[0].descricao
                    });*/
                    
                }
            });
        }
    });
});

sw.get('/deletefuncionalidade/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'delete from funcionalidades where id =$1',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();

                if (err) {
                    console.log("retornou 400 no deletefuncionalidade: "+err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {

                    console.log('retornou 201 no deletefuncionalidade')
                    res.status(201).send({ "id": req.params.id })
                }
            });

        }
    });
});

sw.get('/reserva/:id', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD :" + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'select r.id, ' +
                    'to_char(r.data_inicio, \'yyyy-mm-dd\') as data_inicio, ' +
                    'to_char(r.data_fim, \'yyyy-mm-dd\') as data_fim, ' +
                    'r.valor, r.valor_entrega, r.valor_total, r.observacoes, r.cliente, r.funcionario, r.status_reserva, 0 as produtos ' +
                    'from reservas r ' +
                    'where id = $1 ' +
                    'order by r.id asc;',
                values: [req.params.id]
            }
            var q2 ={
                text: 'select p.id, p.descricao,  p.observacoes, p.valor_custo, p.valor_aluguel, p.valor_venda, p.tipo_produto from produtos p, reservas_produtos rp where rp.id_produto= p.id and rp.id_reserva =$1',
                values: [req.params.id]
            }
            client.query(q, async function (err, result) {

                if (err) {
                    console.log("retornou 500 no reserva q1: "+err.message);
                    res.status(500).send('{' + err.message + '}');
                } else {
                    client.query(q2, async function(err, result1) {
                        if (err) {
                            console.log("retornou 500 no reserva q2: "+err.message);
                            res.status(500).send('{' + err.message + '}'); 
                        } else {
                            done();
                            console.log("retornou 200 no reserva");
                            res.status(200).send({
                                "id": result.rows[0].id,
                                "data_inicio": result.rows[0].data_inicio,
                                "data_fim": result.rows[0].data_fim,
                                "valor": result.rows[0].valor,
                                "valor_entrega": result.rows[0].valor_entrega,
                                "observacoes": result.rows[0].observacoes,
                                "valor_total": result.rows[0].valor_total,
                                "cliente": result.rows[0].cliente,
                                "funcionario": result.rows[0].funcionario,
                                "status_reserva": result.rows[0].status_reserva,
                                "produtos": result1.rows
        
        
                            }) 
                        }
                    })
                  


                }

            })
        }
    });
});

sw.get('/listreserva', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD :" + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            client.query('select r.id, ' +
                'to_char(r.data_inicio, \'yyyy-mm-dd\') as data_inicio, ' +
                'to_char(r.data_fim, \'yyyy-mm-dd\') as data_fim, ' +
                'r.valor, r.valor_entrega, r.valor_total, r.observacoes, r.cliente, r.funcionario, r.status_reserva, 0 as produtos ' +
                'from reservas r ' +
                'order by r.id asc;', async function (err, result) {

                    if (err) {

                        console.log(err);
                        res.status(400).send(`{${err}}`);
                    } else {
                        try {
                            for (let index = 0; index < result.rows.length; index++) {

                                try {
    
                                    rp = await client.query('select p.id, p.descricao,  p.observacoes, p.valor_custo, p.valor_aluguel, p.valor_venda, p.tipo_produto from produtos p, ' +
                                        'reservas_produtos rp where rp.id_produto = p.id and rp.id_produto = $1', [result.rows[index].id])
    
                                    result.rows[index].produtos = rp.rows;
    
                                } catch (err) {
                                    console.log("retorno 400 no listreserva no for reservas_produtos: "+err);
                                    res.status(400).send(`{${err}}`)
                                }
    
                            }
                            
                        } catch (err) {
                            console.log("retorno 400 no listreserva na tabela reservas_produtos: "+err);
                            res.status(400).send(`{${err}}`)
                        }
                     
                        done();
                        res.status(200).send(result.rows);


                    }
                });
        }
    });
});

sw.get('/deletereserva/:id', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q1 = {
                text: 'delete from reservas_produtos where id_reserva = $1',
                values: [req.params.id]

            }

            var q2 = {
                text: 'delete from reservas where id = $1',
                values: [req.params.id]
            }


            client.query(q1, function (err, result) {

                if (err) {

                    console.log("retorno 400 no deletereserva q1: "+err.message);
                    res.status(400).send(`{${err}}`);
                } else {
                    client.query(q2, function (err, result) {
                        if (err) {
                            console.log("retorno 400 no deletereserva q2:"+ err.message);
                            res.status(400).send(`{${err}}`);
                        } else {
                            console.log("retorno 200 no deletereserva");
                            res.status(200).send({ 'id': req.params.id });
                        }

                    })
                }
            });

        }
    });
});

sw.post('/insertreserva', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {

            var q = {
                text: 'insert into reservas (data_inicio, data_fim, valor, valor_entrega, valor_total, observacoes, cliente, funcionario, status_reserva) ' +
                    'values(now(),now(),$1, $2, $3, $4, $5, $6, $7) ' +
                    'returning id,  to_char(data_inicio, \'yyyy-mm-dd\') as data_inicio, to_char(data_fim, \'yyyy-mm-dd\'), valor, valor_entrega, valor_total, observacoes, cliente, funcionario, status_reserva',
                values: [req.body.valor,
                req.body.valor_entrega,
                req.body.valor_total,
                req.body.observacoes,
                req.body.cliente.cpf,
                req.body.funcionario.cpf,
                req.body.status_reserva]
            }
            console.log(q);

            client.query(q, async function (err, result) {

                if (err) {
                    console.log('retornou 400 no insert');
                    console.log('erro insert reserva: ' + err.message);
                } else {
                    try {
                        for (let index = 0; index < req.body.produtos.length; index++) {

                            try {
    
                                await client.query('insert into reservas_produtos (id_reserva, id_produto) values($1, $2)',
                                    [
                                        req.body.id, req.body.produtos[index]
                                    ])
    
    
                            } catch (err) {
                                console.log('retornou 400 no insertreserva no for reservas_produtos: '+ err);
                                res.status(400).send(`{${err}}`);
                            
                    } 
                }
                  }catch (err) {
                    console.log('retornou 400 no insertreserva na tabela reservas_produtos: '+ err);
                    res.status(400).send(`{${err}}`);
                }

                    
                    done();
                    console.log('retornou 201 no insertreserva');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "data_inicio": result.rows[0].data_inicio,
                        "data_fim": result.rows[0].data_fim,
                        "valor": result.rows[0].valor,
                        "valor_entrega": result.rows[0].valor_entrega,
                        "valor_total": result.rows[0].valor_total,
                        "cliente": result.rows[0].cliente,
                        "funcionario": result.rows[0].funcionario,
                        "status_reserva": result.rows[0].status_reserva,
                        "produtos": req.body.produtos
                    });
                }
            });

        }
    });
});
sw.post('/updatereserva', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            console.log(req.body.produtos)
            var q = {
                text: 'update reservas set valor=$2, valor_entrega=$3, valor_total=$4, observacoes=$5, cliente=$6, funcionario=$7, status_reserva=$8 where id =$1 ' +
                    'returning id, to_char(data_inicio, \'yyyy-mm-dd\') as data_inicio, to_char(data_fim, \'yyyy-mm-dd\') as data_fim, ' +
                    'valor, valor_entrega, valor_total, observacoes, cliente, funcionario, status_reserva;',
                values: [
                    req.body.id,
                    req.body.valor,
                    req.body.valor_entrega,
                    req.body.valor_total,
                    req.body.observacoes,
                    req.body.cliente,
                    req.body.funcionario,
                    req.body.status_reserva
                ]
            }
            console.log(q);

            client.query(q, async function (err, result) {

                if (err) {
                    console.log('retornou 400 no updatereserva: '+ err.message);
                    console.log(err.message);
                } else {

                    try {
                        await client.query('delete from reservas_produtos rp where rp.id_reserva = $1',
                            [req.body.id])

                        for (let index = 0; index < req.body.produtos.length; index++) {
                                
                                await client.query('insert into reservas_produtos (id_reserva, id_produto) values($1, $2)',
                                    [
                                        req.body.id, req.body.produtos[index]
                                    ])
                           
                            

                        }
                    } catch (err) {
                        console.log('retornou 400 no updatereserva na tabela reservas_produtos: '+ err);
                        res.status(400).send(`{${err}}`);
                    }


                    done();
                    console.log('retornou 201 no updatereserva');
                   // res.status(201).send(req.body)
                   res.status(201).send({
                        "id": result.rows[0].id,
                        "data_inicio": result.rows[0].data_inicio,
                        "data_fim": result.rows[0].data_fim,
                        "valor": result.rows[0].valor,
                        "valor_entrega": result.rows[0].valor_entrega,
                        "valor_total": result.rows[0].valor_total,
                        "cliente": result.rows[0].cliente,
                        "funcionario": result.rows[0].funcionario,
                        "status_reserva": result.rows[0].status_reserva,
                        "produtos": req.body.produtos
                    });
                }
            });

        }
    });
});

sw.get('/produto/:id', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD :" + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            console.log(req.params.id)
            var q = {
                text: 'select id, descricao, observacoes, valor_custo, ' +
                    ' valor_aluguel, valor_venda, tipo_produto ' +
                    'from produtos p  ' +
                    'where id = $1 ' +
                    'order by id asc;',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
               
                if (err) {
                    console.log('retornou 400 no produto');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`)
                } else {
                    done();
                    console.log('retornou 201 no produto');
                    
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "descricao": result.rows[0].descricao,
                        "observacoes": result.rows[0].observacoes,
                        "valor_custo": result.rows[0].valor_custo,
                        "valor_aluguel": result.rows[0].valor_aluguel,
                        "valor_venda": result.rows[0].valor_venda,
                        "tipo_produto": result.rows[0].tipo_produto
                      
                    });
                }
            });
        }
    })
})


sw.get('/listproduto', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD :" + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            client.query('select id, descricao, observacoes, valor_custo, ' +
                'valor_aluguel, valor_venda ' +
                'from produtos ' +
                'order by id asc;', function (err, result) {
                   
                    if (err) {
                        console.log("retornou 400 no listproduto: "+ err.message);
                        res.status(400).send(`{${err.message}}`);
                    } else {
                        done();
                        console.log('retornou 200 no listproduto');
                        res.status(200).send(result.rows);
                    }
                });
        }
    });
});

sw.get('/deleteproduto/:id', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Nao conseguiu acessar o  BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: `delete from Produtos where id = $1`,
                values: [req.params.id]
            }

            client.query(q, function (err, result) {
              
                if (err) {
                    console.log("retornou 400 no deleteproduto: "+err.message);
                    res.status(400).send(`{${err}}`);
                } else {
                    done(); // closing the connection;
                    console.log('retornou 200 no deleteproduto');
                    res.status(200).send({ 'id': req.params.id });//retorna o nickname deletado.
                }
            });
        }
    });
});

sw.post('/insertproduto', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {

            var q = {
                text: 'insert into produtos (descricao, observacoes, valor_custo, valor_aluguel, valor_venda, tipo_produto) ' +
                    'values($1, $2, $3, $4, $5, $6) ' +
                    'returning id, descricao, observacoes, valor_custo, valor_aluguel, valor_venda, tipo_produto',
                values: [req.body.descricao,
                req.body.observacoes,
                req.body.valor_custo,
                req.body.valor_aluguel,
                req.body.valor_venda,
                req.body.tipo_produto.id]
            }
            console.log(q);

            client.query(q, function (err, result) {
              
                if (err) {
                    console.log('retornou 400 no insertproduto');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`)
                  
                } else {
                    done();
                    console.log('retornou 201 no insertproduto');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "descricao": result.rows[0].descricao,
                        "observacoes": result.rows[0].observacoes,
                        "valor_custo": result.rows[0].valor_custo,
                        "valor_aluguel": result.rows[0].valor_aluguel,
                        "valor_venda": result.rows[0].valor_venda,
                        "tipo_produto": req.body.tipo_produto
                      
                    });
                
                }
            });
        }
    });
});

sw.post('/updateproduto', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Não conseguiu acessar o BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {

            var q = {

                text: 'update produtos set descricao=$2, observacoes=$3, valor_custo=$4, valor_aluguel=$5, valor_venda=$6, tipo_produto=$7 where id = $1 ' +
                'returning id, descricao, observacoes, valor_custo, valor_aluguel, valor_venda, tipo_produto',
                values: [
                    req.body.id,
                    req.body.descricao,
                    req.body.observacoes,
                    req.body.valor_custo,
                    req.body.valor_aluguel,
                    req.body.valor_venda,
                    req.body.tipo_produto
                ]
            }
            console.log(q);

            client.query(q, function (err, result) {
               
                if (err) {
                    console.log("retornou 400 no updateproduto: " + err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    done();
                    console.log('retornou 200 no updateproduto');
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "descricao": result.rows[0].descricao,
                        "observacoes": result.rows[0].observacoes,
                        "valor_custo": result.rows[0].valor_custo,
                        "valor_aluguel": result.rows[0].valor_aluguel,
                        "valor_venda": result.rows[0].valor_venda,
                        "tipo_produto": req.body.tipo_produto
                      
                    });
                }
            });
        }
    });
});

sw.get('/foto/:id', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'select id, descricao, b64, produto_id, ' +
                    'produto_id from Fotos ' +
                    'where id = $1 ' +
                    'order by id asc;',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
               
                if (err) {
                    console.log('retornou 400 no insertfoto');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`)
                } else {
                    done();
                    console.log('retornou 201 no insertfoto');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "descricao": result.rows[0].descricao,
                        "b64": result.rows[0].b64,
                        "produto_id": result.rows[0].produto_id
                    });
                }
            });
        }
    })
})
sw.get('/listfoto', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "   + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            client.query('select id, descricao, b64, produto_id, ' +
                ' produto_id from Fotos order by id asc; ', function (err, result) {

                   
                    if (err) {
                        console.log("retornou 400 no listfoto: "+err.message);
                        res.status(400).send(`{${err.message}}`);
                    } else {
                        done();
                        console.log("retornou 200 no listfoto");
                        res.status(200).send(result.rows);
                    }

                });
        }
    });
});

sw.get('/deletefoto/:id', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'delete from fotos where id = $1',
                values: [req.params.id]
            }

            client.query(q, function (err, result) {
              
                if (err) {
                    console.log("retornou 400 no deletefoto: "+err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    done(); // closing the connection;
                    console.log("retornou 200 no deletefoto");
                    res.status(200).send({ 'id': req.params.id });//retorna o nickname deletado.
                }
            });
        }
    });
})

sw.post('/insertfoto', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'insert into fotos (descricao, b64, produto_id) ' +
                    'values ($1, $2, $3) ' +
                    'returning id, descricao, b64, produto_id',
                values: [
                    req.body.descricao,
                    req.body.b64,
                    req.body.produto_id.id
                ]

            }
            console.log(q);

            client.query(q, function (err, result) {
               
                if (err) {
                    console.log('retornou 400 no insertfoto');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    done();
                    console.log('retornou 201 no insertfoto');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "descricao": result.rows[0].descricao,
                        "b64": result.rows[0].b64,
                        //"produto_id": result.rows[0].produto_id
                        "produto_id": req.body.produto_id
                    });
                }

            });
        }
    });
});

sw.post('/updatefoto', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            console.log(req.body.produto_id.id)
            var q = {
                text: 'update Fotos set descricao=$2, b64=$3, produto_id=$4 where id= $1',
                values: [
                    req.body.id,
                    req.body.descricao,
                    req.body.b64,
                    req.body.produto_id]
            }
            console.log(q);

            client.query(q, function (err, result) {
              
                if (err) {
                    console.log('retornou 400 no updatefoto ');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    done();
                    console.log('retornou 201 no updatefoto');
                res.status(200).send(req.body)
                  /*res.status(200).send({
                        "id": result.rows[0].id,
                        "descricao": result.rows[0].descricao,
                        "b64": result.rows[0].b64,
                        "produto_id": result.rows[0].produto_id,
                        
                    });*/
                }

            });
        }
    });
});

sw.get('/tiposproduto/:id', function (req, res) {
    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'select id, nome ' +
                    'from tiposProduto ' +
                    'where id = $1 ' +
                    'order by id asc;',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no tiposproduto');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`)
                } else {
                    console.log('retornou 201 no tiposproduto');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "nome": result.rows[0].nome
                    });
                }
            });
        }
    });

});


sw.get('/listtipoproduto', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err}}`);
        } else {
            client.query('select id, nome ' +
                'from tiposProduto ' +
                'order by id asc;', function (err, result) {
                    done();
                    if (err) {
                        console.log("retorno 400 no listtipoproduto: "+err.message);
                        res.status(400).send(`{${err}}`);
                    } else {
                        console.log("retorno 200 no listtipoproduto");
                        res.status(200).send(result.rows);
                    }
                });
        }
    });
});

sw.get('/deletetipoproduto/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'delete from tiposProduto where id = $1',
                values: [req.params.id]
            }
            client.query(q, function (err, client) {
                done(); // closing the connection;
                if (err) {
                    console.log("retorno 400 no deletetipoproduto: "+err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    console.log("retorno 200 no deletetipoproduto");
                    res.status(200).send({ 'id': req.params.id });//retorna o nickname deletado.
                }

            });
        }
    });
});

sw.post('/inserttipoproduto', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'insert into tiposProduto (nome) ' +
                    'values($1) ' +
                    'returning(nome)',
                values: [
                    req.body.nome
                ]
            }
            console.log(q);

            client.query(q, function (err, result) {
              
                if (err) {
                    console.log('retornou 400 no inserttipoproduto');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    done();
                    console.log('retornou 201 no inserttipoproduto');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "nome": result.rows[0].nome
                    });
                }

            });
        }
    });
});

sw.post('/updatetipoproduto', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
         
            var q = {
                text: 'update tiposProduto set nome=$2 where id =$1',
                values: [
                    req.body.id,
                    req.body.nome
                ]
            }
            console.log(q);

            client.query(q, function (err, result) {
               
                if (err) {
                    console.log('retornou 400 no updatetipoproduto ');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    done();
                    console.log('retornou 200 no updatetipoproduto');
                    res.status(200).send(req.body);
                   /* res.status(200).send({
                        "id": result.rows[0].id,
                        "nome": result.rows[0].nome
                    });*/
                }

            });
        }
    });
});

sw.get('/locacao/:id', function (req, res) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
           var q = {
                text: 'select id, ' +
                    'to_char(data_retirada, \'yyyy-mm-dd\') as data_retirada, ' +
                    'to_char(data_previsao_entrega, \'yyyy-mm-dd\') as data_previsao_entrega, ' +
                    'to_char(data_entrega, \'yyyy-mm-dd\') as data_entrega, ' +
                    'to_char(data_previsao_pagamento, \'yyyy-mm-dd\') as data_previsao_pagamento, ' +
                    'valor_total, valor_pago, observacoes, funcionario, tipos_pagamento, 0 as reservas ' +
                    'from locacoes ' +
                    'where id = $1 ' +
                    'order by id;',
                values: [req.params.id]
            }
           var q2 = {
                text: 'select r.id, r.data_inicio, r.data_fim, r.valor, r.valor_entrega, r.valor_total, r.observacoes, r.cliente, r.funcionario, r.status_reserva from reservas r, locacoes_reservas lr where lr.id_reserva=r.id and lr.id_locacao = $1 ',
                
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no locacao q1');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`)
                } else {
                    client.query(q2, function (err, result1) {
                      if (err) {
                        console.log('retornou 400 no locacao q2');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`)
                      } else {
                        console.log('retornou 201 no locacao');
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "data_retirada": result.rows[0].data_retirada,
                        "data_previsao_entrega": result.rows[0].data_previsao_entrega,
                        "data_entrega": result.rows[0].data_entrega,
                        "data_previsao_pagamento": result.rows[0].data_previsao_pagamento,
                        "valor_total": result.rows[0].valor_total,
                        "valor_pago": result.rows[0].valor_pago,
                        "observacoes": result.rows[0].observacoes,
                        "funcionario": result.rows[0].funcionario,
                        "tipos_pagamento": result.rows[0].tipos_pagamento,
                        "reservas": result1.rows

                    });
                      }  
                    })
                    
                }
            });
        }
    })
})

sw.get('/listlocacao', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {

            client.query('select id, ' +
                'to_char(data_retirada, \'yyyy-mm-dd\') as data_retirada, ' +
                'to_char(data_previsao_entrega, \'yyyy-mm-dd\') as data_previsao_entrega, ' +
                'to_char(data_entrega, \'yyyy-mm-dd\') as data_entrega, ' +
                'to_char(data_previsao_pagamento, \'yyyy-mm-dd\') as data_previsao_pagamento, ' +
                'valor_total, valor_pago, observacoes, funcionario, tipos_pagamento, 0 as reservas ' +
                'from locacoes ' +
                'order by id;', async function (err, result) {

                    if (err) {
                        console.log(err.message);
                        res.status(400).send(`{${err.message}}`);
                    } else {

                        for (let index = 0; index < result.rows.length; index++) {
                            try {
                                lr = await client.query('select r.id, ' +
                                    'to_char(r.data_inicio, \'yyyy-mm-dd\') as data_inicio, ' +
                                    'to_char(r.data_fim, \'yyyy-mm-dd\') as data_fim, ' +
                                    'r.valor, r.valor_entrega, r.valor_total, r.observacoes, r.cliente, r.funcionario, r.status_reserva ' +
                                    'from reservas r, locacoes_reservas lr ' +
                                    'where lr.id_reserva = r.id and lr.id_reserva = $1 ', [result.rows[index].id])

                                result.rows[index].reservas = lr.rows


                            } catch (err) {
                                console.log("retornou 400 no listlocacao: " + err.message)
                                res.status(400).send(`{${err.message}}`);
                            }

                        }
                        done();
                        res.status(200).send(result.rows);
                    }
                });

        }
    });

});

sw.get('/deletelocacao/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q1 = {
                text: 'delete from locacoes_reservas where id_locacao = $1 ',
                values: [req.params.id]
            }

            var q2 = {
                text: 'delete from locacoes where id = $1 ',
                values: [req.params.id]
            }

            client.query(q1, function (err, result) {

                if (err) {
                    console.log("retornou 400 no deletelocacao q1:" + err.message);
                    res.status(400).send(`{${err}}`);
                } else {

                    client.query(q2, function (err, result) {
                        done();
                        if (err) {
                            console.log("retornou 400 no deletelocacao q2:" + err.message);
                            res.status(400).send(`{${err.message}}`);
                        } else {
                            console.log("retornou 200 n deletelocacao")
                            res.status(200).send({ 'id': req.params.id });
                        }
                    })
                }

            });
        }
    });
});

sw.post('/insertlocacao', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'insert into locacoes (data_retirada, data_previsao_entrega, data_entrega, data_previsao_pagamento, valor_total, valor_pago, observacoes, funcionario, tipos_pagamento) ' +
                    ' values(now(), now(), now(), now(), $1, $2, $3, $4, $5) ' +
                    'returning id, to_char(data_retirada, \'yyyy-mm-dd\') as data_retirada , ' +
                    ' to_char(data_previsao_entrega, \'yyyy-mm-dd\') as data_previsao_entrega, ' +
                    'to_char(data_entrega, \'yyyy-mm-dd\') as data_entrega, ' +
                    'to_char(data_previsao_pagamento, \'yyyy-mm-dd\') as data_previsao_pagamento, ' +
                    'valor_total, valor_pago, observacoes, funcionario, tipos_pagamento',
                values: [
                    req.body.valor_total,
                    req.body.valor_pago,
                    req.body.observacoes,
                    req.body.funcionario.cpf,
                    req.body.tipos_pagamento]
            }
            console.log(q);

            client.query(q, async function (err, result) {

                if (err) {
                    console.log('retornou 400 no insertlocacao');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    try {
                        for (let index = 0; index < req.body.reservas.length; index++) {
                           
    
                                await client.query('insert into locacoes_reservas (id_locacao, id_reserva ) values($1, $2)',
                                    [
                                        req.body.id, req.body.reservas[index]
                                    ])
    
                           
    
                        }
                    } catch (err) {
                        console.log('retornou 400 no insertlocacao na tabela locacoes_reservas: '+err.message);
                            res.status(400).send(`{${err}}`);
                    }
                  
                    done();
                    console.log('retornou 201 no insertlocacao');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "data_retirada": result.rows[0].data_retirada,
                        "data_previsao_entrega": result.rows[0].data_previsao_entrega,
                        "data_entrega": result.rows[0].data_entrega,
                        "data_previsao_pagamento": result.rows[0].data_previsao_pagamento,
                        "valor_total": result.rows[0].valor_total,
                        "valor_pago": result.rows[0].valor_pago,
                        "observacoes": result.rows[0].observacoes,
                        "funcionario": req.body.funcionario,
                        "tipos_pagamento": req.body.tipo_produto,
                        "reservas": req.body.reservas

                    });
                }

            });
        }
    });
});

sw.post('/updatelocacao', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            
            var q = {
                text: 'update locacoes set valor_total=$2, valor_pago=$3, observacoes=$4, funcionario=$5, tipos_pagamento=$6 where id = $1 ' +
                    'returning id, to_char(data_retirada, \'yyyy-mm-dd\') as data_retirada , ' +
                    ' to_char(data_previsao_entrega, \'yyyy-mm-dd\') as data_previsao_entrega, ' +
                    'to_char(data_entrega, \'yyyy-mm-dd\') as data_entrega, ' +
                    'to_char(data_previsao_pagamento, \'yyyy-mm-dd\') as data_previsao_pagamento, ' +
                    'valor_total, valor_pago, observacoes, funcionario, tipos_pagamento',
                values: [
                    
                    req.body.id,
                    req.body.valor_total,
                    req.body.valor_pago,
                    req.body.observacoes,
                    req.body.funcionario,
                    req.body.tipos_pagamento
                ]
            }
            console.log(q);
            
            client.query(q, async function (err, result) {

                if (err) {
                    console.log('retornou 400 no updatelocacao: '+err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {

                    try {
                                //remove todas as patentes
                            await client.query('delete from locacoes_reservas lr where id_locacao = $1', [req.body.id])
                       
                        for (let index = 0; index < req.body.reservas.length; index++) {
                            
                                await client.query('insert into locacoes_reservas (id_locacao, id_reserva) values($1, $2)',
                                    [
                                        
                                       
                                
                                        req.body.id, 
                                        req.body.reservas[index]
                                        
                                       
                                    ]);

                            

                        }
                    } catch (err) {
                        console.log('retornou 400 no updatelocacao na tabela locacoes_reservas: '+ err.message);
                        res.status(400).send(`{${err}}`);
                    }

                    done();
                    console.log('retornou 201 no updatelocacao');
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "data_retirada": result.rows[0].data_retirada,
                        "data_previsao_entrega": result.rows[0].data_previsao_entrega,
                        "data_entrega": result.rows[0].data_entrega,
                        "data_previsao_pagamento": result.rows[0].data_previsao_pagamento,
                        "valor_total": result.rows[0].valor_total,
                        "valor_pago": result.rows[0].valor_pago,
                        "observacoes": result.rows[0].observacoes,
                        "funcionario": req.body.funcionario,
                        "tipos_pagamento": req.body.tipo_produto,
                        "reservas": req.body.reservas

                    });
                }

            });
        }
    });
});

sw.get('/parcelamento/:id', function (req, res) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            q = {
                text: 'select id, numero_parcela, ' +
                    'to_char(data_previsao_pagamento, \'yyyy-mm-dd\') as data_previsao_pagamento, ' +
                    'to_char(data_pagamento, \'yyyy-mm-dd\') as data_pagamento, ' +
                    'valor_total, valor_pago, id_locacao ' +
                    'from parcelamentos ' +
                    'where id = $1 ' +
                    'order by id',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no parcelamento');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`)
                } else {
                    console.log('retornou 200 no parcelamento');
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "numero_parcela": result.rows[0].numero_parcela,
                        "data_previsao_pagamento": result.rows[0].data_previsao_pagamento,
                        "data_pagamento": result.rows[0].data_pagamento,
                        "valor_total": result.rows[0].valor_total,
                        "valor_pago": result.rows[0].valor_pago,
                        "id_locacao": result.rows[0].id_locacao

                    });
                }
            });
        }
    })
})

sw.get('/listparcelamento', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {

            client.query('select id, numero_parcela, ' +
                'to_char(data_previsao_pagamento, \'yyyy-mm-dd\') as data_previsao_pagamento, ' +
                'to_char(data_pagamento, \'yyyy-mm-dd\') as data_pagamento, ' +
                'valor_total, valor_pago, id_locacao ' +
                'from parcelamentos ' +
                'order by id', function (err, result) {
                    done();
                    if (err) {
                        console.log("retornou 400 no listparcelamento: " + err.message);
                        res.status(400).send(`{${err.message}}`);
                    } else {
                        console.log("retornou 200 no listparcelamento");
                        res.status(200).send(result.rows);
                    }
                });

        }
    });

});

sw.get('/deleteparcelamento/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q1 = {
                text: 'delete from parcelamentos where id = $1',
                values: [req.params.id]
            }


            client.query(q1, function (err, result) {

                if (err) {
                    console.log("retornou 400 deleteparcelamento: " + err.message);
                    res.status(400).send(`{${err.message}}`)
                } else {
                    console.log("retornou 200 deleteparcelamento");
                    res.status(200).send({ 'id': req.params.id })
                }
            })
        }
    });
});

sw.post('/insertparcelamento', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'insert into parcelamentos (numero_parcela, data_previsao_pagamento, data_pagamento, valor_total, valor_pago, id_locacao) ' +
                    'values($1, $2, $3, $4, $5, $6) ' +
                    'returning numero_parcela, ' +
                    'to_char(data_previsao_pagamento, \'yyyy-mm-dd\') , ' +
                    'to_char(data_pagamento, \'yyyy-mm-dd\') , ' +
                    'valor_total, valor_pago, id_locacao',
                values: [
                    req.body.numero_parcela,
                    req.body.data_previsao_pagamento,
                    req.body.data_pagamento,
                    req.body.valor_total,
                    req.body.valor_pago,
                    req.body.id_locacao.id]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insertparcelamento');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    console.log('retornou 201 no insertparcelamento');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "data_previsao_pagamento": result.rows[0].data_previsao_pagamento,
                        "data_pagamento": result.rows[0].data_pagamento,
                        "valor_total": result.rows[0].valor_total,
                        "valor_pago": result.rows[0].valor_pago,
                        "id_locacao": req.body.id_locacao

                    });
                }

            });
        }
    });
});

sw.post('/updateparcelamento', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'update parcelamentos set numero_parcela=$2, data_previsao_pagamento=$3, data_pagamento=$4, valor_total=$5, valor_pago=$6, id_locacao=$7 where id=$1 ' +
                    'returning numero_parcela, ' +
                    'to_char(data_previsao_pagamento, \'yyyy-mm-dd\') ,' +
                    'to_char(data_pagamento, \'yyyy-mm-dd\') ,' +
                    'valor_total, valor_pago, id_locacao',
                values: [
                    req.body.id,
                    req.body.numero_parcela,
                    req.body.data_previsao_pagamento,
                    req.body.data_pagamento,
                    req.body.valor_total,
                    req.body.valor_pago,
                    req.body.id_locacao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no updateparcelamento: ' + err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    console.log('retornou 201 no updateparcelamento');
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "data_previsao_pagamento": result.rows[0].data_previsao_pagamento,
                        "data_pagamento": result.rows[0].data_pagamento,
                        "valor_total": result.rows[0].valor_total,
                        "valor_pago": result.rows[0].valor_pago,
                        "id_locacao": req.body.id_locacao

                    });
                }

            });
        }
    });
});


sw.get('/situacao/:id', function (req, res) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            q = {
                text: 'select id, descricao ' +
                    'from situacao ' +
                    'where id = $1 ' +
                    'order by id ',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no situacao: ' + err.message);
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`)
                } else {
                    console.log('retornou 201 no situacao');
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "descricao": result.rows[0].descricao,
                       

                    });
                }
            });
        }
    })
})

sw.get('/listsituacao', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {

            client.query('select id, descricao ' +
                'from situacao ' +
                'order by id ', function (err, result) {
                    done();
                    if (err) {
                        console.log("retornou 400 no listsituacao: " + err.message);
                        res.status(400).send(`{${err.message}}`);
                    } else {
                        console.log("retornou 200 no listsituacao");
                        res.status(200).send(result.rows);
                    }
                });

        }
    });

});

sw.get('/deletesituacao/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: " + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'delete from situacao where id= $1',
                values: [req.params.id]
            }


            client.query(q, function (err, result) {

                if (err) {
                    console.log("retornou 400 no deletesituacao: " + err.message);
                    res.status(400).send(`{${err.message}}`)
                } else {
                    console.log("retornou 200 no deletesituacao");
                    res.status(200).send({ 'id': req.params.id })
                }
            })
        }
    });
});

sw.post('/insertsituacao', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'insert into situacao (descricao) ' +
                    'values($1) ' +
                    ' returning descricao',
                values: [req.body.descricao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insertsituacao');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    console.log('retornou 201 no insertsitacao');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "descricao": result.rows[0].descricao,
                       

                    });
                }

            });
        }
    });
});

sw.post('/updatesituacao', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'update situacao set descricao=$2 where id= $1 ' +
                    'returning id, descricao',
                values: [
                    req.body.id,
                    req.body.descricao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no updatesituacao: ' + err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    console.log('retornou 201 no updatesitacao');
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "descricao": result.rows[0].descricao,
                       

                    });
                }

            });
        }
    });
});

sw.get('/acompanhamento/:id', function (req, res) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
           
           var q = {
                text: 'select id, sequencia_passo, ' +
                    'to_char(data, \'yyyy-mm-dd\') as data, ' +
                    'observacoes, id_locacao, id_situacao ' +
                    'from acompanhamento ' +
                    'where id = $1 ' +
                    'order by id; ',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no acompanhamento');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`)
                } else {
                    console.log('retornou 201 no acompanhamento');
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "sequencia_passo": result.rows[0].sequencia_passo,
                        "data": result.rows[0].data,
                        "observacoes": result.rows[0].observacoes,
                        "id_locacao": result.rows[0].id_locacao,
                        "id_situacao": result.rows[0].id_situacao
                       

                    });
                }
            });
        }
    })
})

sw.get('/listacompanhamento', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {

            client.query('select id, sequencia_passo, ' +
                'to_char(data, \'yyyy-mm-dd\') as data, ' +
                'observacoes, id_locacao, id_situacao ' +
                'from acompanhamento ' +
                'order by id; ', function (err, result) {
                    done();
                    if (err) {
                        console.log("retornou 400 no listacompanhamento: " + err.message);
                        res.status(400).send(`{${err.message}}`);
                    } else {
                        console.log("retornou 200 no listacompanhamento");
                        res.status(200).send(result.rows);
                    }
                });

        }
    });

});

sw.get('/deleteacompanhamento/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'delete from acompanhamento where id = $1',
                values: [req.params.id]
            }


            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log("retorno 400 no deleteacompanhamento: " + err.message);
                    res.status(400).send(`{${err.message}}`)
                } else {
                    console.log("retorno 200 no deleteacompanhamento");
                    res.status(200).send({ 'id': req.params.id })
                }
            })
        }
    });
});

sw.post('/insertacompanhamento', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            var q = {
                text: 'insert into acompanhamento (sequencia_passo, data, observacoes, id_locacao, id_situacao) ' +
                    'values($1, $2, $3, $4, $5) ' +
                    'returning sequencia_passo, ' +
                    'to_char(data, \'yyyy-mm-dd\'), ' +
                    'observacoes, id_locacao, id_situacao',
                values: [
                    req.body.sequencia_passo,
                    req.body.data,
                    req.body.observacoes,
                    req.body.id_locacao.id,
                    req.body.id_situacao.id
                    ]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insertacompanhamento');
                    console.log(err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    console.log('retornou 201 no insertacompanhamento');
                    res.status(201).send({
                        "id": result.rows[0].id,
                        "data": result.rows[0].data,
                        "observacoes": result.rows[0].observacoes,
                        "id_locacao": req.body.id_locacao,
                        "id_situacao": req.body.id_situacao
                       

                    });
                }

            });
        }
    });
});

sw.post('/updateacompanhamento', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: "  + err.message);
            res.status(400).send(`{${err.message}}`);
        } else {
            console.log(req.body.id)
            var q = {
                
                text: 'update acompanhamento set  sequencia_passo=$2, data=$3, observacoes=$4, id_locacao=$5, id_situacao=$6 where id =$1 ' +
                    'returning sequencia_passo, ' +
                    'to_char(data, \'yyyy-mm-dd\'), ' +
                    'observacoes, id_locacao, id_situacao',
                values: [
                    req.body.id,
                    req.body.sequencia_passo,
                    req.body.data,
                    req.body.observacoes,
                    req.body.id_locacao,
                    req.body.id_situacao
                    ]
            }
            console.log(q);
            
            client.query(q, function (err, result) {
               
                if (err) {
                    console.log('retornou 400 no updateacompanhamento: ' + err.message);
                    res.status(400).send(`{${err.message}}`);
                } else {
                    done();
                    console.log('retornou 200 no updateacompanhamento');
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "data": result.rows[0].data,
                        "observacoes": result.rows[0].observacoes,
                        "id_locacao": req.body.id_locacao,
                        "id_situacao": req.body.id_situacao
                       

                    });
                }

            });
        }
    });
});


sw.listen(4000, function () {
    console.log('Server is running.. on Port 4000')
})