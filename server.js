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
sw.post('/login',function(req, res, next) {
    
    postgres.connect(function(err, client, done) {
        
        if (err) {
            
           console.log("Nao conseguiu acessar o  BD "+ err);
           res.status(400).send('{'+err+'}');
        } else {
            var q={
                text: 'select cpf, to_char(data_cadastro, \'yyyy-mm-dd\') as data_cadastro, situacao from pessoas p  where cpf = $1 and password = $2;',
                values: [req.body.cpf, req.body.password]
            }
            console.log(q);

            client.query(q,function(err, result) {
                done();
                if (err) {
                    console.log('retornou 400 pelo login');
                
                    res.status(400).send('{'+err+'}');
                } else {
                    
                    if (result.rows.length > 0) {
                        
                        res.status(201).send({"cpf":  req.body.cpf, 'data_cadastro': result.rows[0].data_cadastro}) 
                    } else {
                        
                        res.status(204).send();
                    }
                }
            })
        }
    })
})

sw.get('/cliente/:id', function(req, res) {
    
    //estabelece uma conexao com o bd.
    postgres.connect(function(err, client, done) {
        
        if (err) {
            console.log("Não conseguiu acessar o BD :"+ err);
            res.status(400).send('{'+err+'}');
        } else {
            var q ={
                text: 'SELECT p.id, p.nome, p.telefone, p.cep, ' +
                'p.logradouro, p.bairro, p.complemento, p.observacoes, ' +
                'p.data_cadastro, ' +
                'to_char(p.data_cadastro, \'dd/mm/yyyy\') as data_cadastro, ' +
                'p.username, p.cpf, p.password, ' +
                'to_char(p.data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login, ' +
                'c.rg, c.cnpj, c.ie ' +
                'FROM pessoas p inner join clientes c on (p.id=c.id_pessoa) ' +
                'where id = $1 order by p.id asc;',
                values: [req.params.id]
            }
            client.query(q, async function(err, result) {

                if (err) {
                    console.log(err);
                    res.status(500).send('{'+err+'}');
                } else {
                    
                    done();
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "nome": result.rows[0].nome,
                        "email": result.rows[0].email,
                        "telefone": result.rows[0].telefone,
                        "cep": result.rows[0].cep,
                        "logradouro": result.rows[0].logradouro,
                        "bairro": result.rows[0].bairro,
                        "numero": result.rows[0].numero,
                        "complemento": result.rows[0].complemento,
                        "observacoes": result.rows[0].observacoes,
                        "username": result.rows[0].username,
                        "cpf": result.rows[0].cpf,
                        "password": result.rows[0].password,
                        "cliente": {
                            "rg": result.rows[0].rg,
                            "cnpj": result.rows[0].cnpj,
                            "ie": result.rows[0].ie
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
            client.query('SELECT p.id, p.nome, p.telefone, p.cep, ' +
                'p.logradouro, p.bairro, p.complemento, p.observacoes, ' +
                'p.data_cadastro, ' +
                'to_char(p.data_cadastro, \'dd/mm/yyyy\') as data_cadastro, ' +
                'p.username,p.cpf, p.password, p.tipo' +
                ' to_char(p.data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login, ' +
                'c.rg, c.cnpj, c.ie ' +
                'FROM pessoas p inner join clientes c on (p.id=c.id_pessoa) ' +
                'order by p.id asc;', function (err, result) {
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

sw.get('/deletecliente/:id', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não consequiu acessar o banco de dados!")
        } else {
            var q1 = {
                text: `delete from clientes where id_pessoa = $1`,
                values: [req.params.id]
            }
            var q2 = {
                text: `delete FROM pessoas where id = $1`,
                values: [req.params.id]
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
                })


            }
        })
    });
});

sw.post('/insertcliente', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não coseguiu acessar o BD " + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: 'insert into pessoas (nome, email, telefone, cep, logradouro, bairro, numero, complemento,observacoes, data_cadastro, username, cpf, password, data_ultimo_login, tipo) ' +
                    'values($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10, $11, $12, now(), $13) ' +
                    'returning id, nome, email, telefone, cep, ' +
                    'logradouro, bairro, numero, complemento, observacoes, ' +
                    'to_char(data_cadastro, \'dd/mm/yyyy\') as data_cadastro, ' +
                    'username,cpf, password' +
                    'to_char(data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login, '+
                    'tipo ',
                values: [
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
                    req.body.cpf,
                    req.body.password,
                    req.body.tipo == true ? "C" : "F"
                ]
            }
        

            console.log(q1);

            client.query(q1, function (err, result1) {
                var q2 = {
                    text: `insert into clientes (rg, cnpj, ie, id_pessoa) values ($1, $2, $3, $4) returning rg, cnpj, ie;`,
                    values: [
                        req.body.cliente.rg,
                        req.body.cliente.cnpj,
                        req.body.cliente.ie,
                        result1.rows[0].id
                      
                        
                    ]
                }
                if (err) {
                    console.log('retornou 400 no insert q1: '+err.message);
                    res.status(400).send(`{${err}}`);
                    
                } else {
                    client.query(q2, function (err, result2) {
                        if (err) {
                            console.log('retornou 400 no insert q2:'+err.message);
                            res.status(400).send(`{${err}}`);
                        } else {
                            done(); // closing the connection;
                            console.log(`retornou 201 no insertcliente`)
                            res.status(201).send({
                                "id": result1.rows[0].id,
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
                                    "cpf": result2.rows[0].cpf,
                                    "rg": result2.rows[0].rg,
                                    "cnpj": result2.rows[0].cnpj,
                                    "ie": result2.rows[0].ie
                                  
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
                    'username=$11, cpf=$12, password=$13, tipo = $14 where id=$1 ' +
                    'returning nome, email, telefone, cep, ' +
                    'logradouro, bairro, numero, complemento, observacoes, ' +
                    'to_char(data_cadastro, \'dd/mm/yyyy\') as data_cadastro, ' +
                    'username,cpf, password, ' +
                    'to_char(data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login, tipo',
                values: [
                    req.body.id,
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
                    req.body.cpf,
                    req.body.password,
                    req.body.tipo == true ? "C" : "F"

                ]
            }
          

            console.log(q1);
           

            client.query(q1, function (err, result1) {
                var q2 = {
                    text: `update clientes set rg=$1, cnpj=$2, ie=$3 where id_pessoa=$4
                           returning rg, cnpj, ie, id_pessoa `,
                    values: [
                        req.body.rg,
                        req.body.cnpj,
                        req.body.ie,
                        req.body.id
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
                                "id": result1.rows[0].id,
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
                                "cliente": {
                                    "rg": result2.rows[0].rg,
                                    "cnpj": result2.rows[0].cnpj,
                                    "ie": result2.rows[0].ie,

                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

sw.get('/listfuncionario', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o DB :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query('SELECT p.id, p.nome, p.telefone, p.cep, '+
                'p.logradouro, p.bairro, p.complemento, p.observacoes, '+
                'p.data_cadastro, '+
                'to_char(p.data_cadastro, \'dd/mm/yyyy\') as data_cadastro, '+
                'p.username, p.cpf, p.password, '+
                'to_char(p.data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login, p.tipo, '+
                'f.numero_ctps,to_char(f.data_contratacao, \'dd/mm/yyyy\') as data_contratacao, to_char(f.data_demissao, \'dd/mm/yyyy\') as data_demissao, f.perfil ' +
                'FROM pessoas p inner join funcionarios f on (p.id=f.id_pessoa) '+ 
                'order by p.id asc;', function (err, result) {
                    done(); // closing the connection;
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
sw.delete('/deletefuncionario/:id', function (req, res) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não consequiu acessar o banco de dados!");
        } else {
            var q1 = {
                text: `delete from funcionarios where id_pessoa = $1`,
                values: [req.params.id]
            }
            var q2 = {
                text: `delete FROM pessoas where id = $1`,
                values: [req.params.id]
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
            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: 'insert into pessoas (nome, email, telefone, cep, logradouro, bairro, numero, complemento, observacoes, data_cadastro, username, cpf, password, data_ultimo_login, tipo) ' +
                    'values($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10, $11, $12, $13 now()) ' +
                    'returning nome, email, telefone, cep, ' +
                    'logradouro, bairro, numero, complemento, observacoes, ' +
                    'to_char(data_cadastro, \'dd/mm/yyyy\') as data_cadastro, ' +
                    'username,cpf password, ' +
                    'to_char(data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login, tipo ',
                values: [
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
                    req.body.cpf,
                    req.body.password.
                    req.body.tipo
                ]
            }
            var q2 = {
                text: 'insert into funcionarios (numero_ctps, data_contratacao, data_demissao, perfil, id_pessoa) ' +
                    'values($1, now(), now(), $2, $3) ' +
                    'returning numero_ctps, ' +
                    'to_char(data_contratacao, \'dd/mm/yyyy\') as data_contratacao, ' +
                    'to_char(data_demissao, \'dd/mm/yyyy\') as data_demissao, perfil, id_pessoa',
                values: [
                    req.body.numero_ctps,
                    req.body.perfil,
                    req.body.id_pessoa

                ]
            }
            console.log(q1);

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no insert');
                    res.status(400).send(`{${err}}`);
                } else {
                    client.query(q2, function (err, result2) {
                        if (err) {
                            console.log('retornou 400 no insert');
                            res.status(400).send(`{${err}}`);
                        } else {
                            done(); // closing the connection;
                            console.log('retornou 201 no insertfuncionario');
                            res.status(201).send({
                                "id": result1.rows[0].id,
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
                                    "id_pessoa": result2.rows[0].id_pessoa
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})

sw.put('/updatefuncionario', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: 'update pessoas set nome=$2, email=$3, telefone=$4, cep=$5, ' +
                    'logradouro=$6, bairro=$7, numero=$8, complemento=$9, observacoes = $10, ' +
                    'username=$11, cpf=$12 password=$13, tipo=$14 where id=$1 ' +
                    'returning nome, email, telefone, cep, ' +
                    'logradouro, bairro, numero, complemento, observacoes, ' +
                    'to_char(data_cadastro, \'dd/mm/yyyy\') as data_cadastro, ' +
                    'username,cpf, password, ' +
                    'to_char(data_ultimo_login, \'dd/mm/yyyy\') as data_ultimo_login, tipo',
                values: [
                    req.body.id,
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
                    req.body.cpf,
                    req.body.password,
                    req.body.tipo


                ]
            }
            var q2 = {
                text: 'update funcionarios set numero_ctps=$1 , perfil=$2 where id_pessoa=$3  ' +
                    'returning numero_ctps, ' +
                    'to_char(data_contratacao, \'dd/mm/yyyy\') as data_contratacao, ' +
                    'to_char(data_demissao, \'dd/mm/yyyy\') as data_demissao, ' +
                    'perfil, id_pessoa',
                values: [
                    req.body.numero_ctps,
                    req.body.perfil,
                    req.body.id_pessoa
                ]
            }
            console.log(q1);
            console.log(q2);

            client.query(q1, function (err, result1) {
                if (err) {
                    console.log('retornou 400 no update');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    client.query(q2, function (err, result2) {
                        if (err) {
                            console.log(err);
                            console.log('retornou 400 no updatefuncionario');
                            res.status(400).send(`{${err}}`);
                        } else {

                            done();

                            console.log('retornou 201 no updatefuncionario');
                            res.status(201).send({
                                "id": result1.rows[0].id,
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
                                    "id_pessoa": result2.rows[0].id_pessoa
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

            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: 'select p.id, p.descricao, p.funcionalidade, 0 as funcionalidades from perfis p where id = $1 order by p.descricao asc;',
                values: [req.params.id]
            }
            var q2 = {
                text: 'select f.id, f.descricao from funcionalidades f, perfis_funcionarios pf where pf.id_funcionalidade and f.id = $1',
                values: [req.params.id]
            }

            client.query(q1, async function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(500).send(`{${err}}`);
                } else {
                    client.query(q2, async function (err, result1) {
                        if (err) {
                            console.log(err);
                            res.status(500).send(`{${err}}`)
                        } else {
                            done();
                            res.status(200).send({
                                "id": result.rows[0].id,
                                "descricao": result.rows[0].descricao,
                                "funcionalidade": result.rows[0].funcionalidade,
                                "funcionalidades": result1.rows
                            })
                        }

                    })

                }
            })



        }
    });

});
sw.get('/perfil/:id', function(req, res) {
    
    //estabelece uma conexao com o bd.
    postgres.connect(function(err, client, done) {
        
        if (err) {
            console.log("Não conseguiu acessar o BD :"+ err);
            res.status(400).send('{'+err+'}');
        } else {
            var q ={
                text: 'SELECT p.id, p.descricao' +
                'FROM perfis p'+
                'where id = $1 order by p.id asc;',
                values: [req.params.id]
            }
            client.query(q, async function(err, result) {

                if (err) {
                    console.log(err);
                    res.status(500).send('{'+err+'}');
                } else {
                    
                    done();
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "Descricao": result.rows[0].descricao,
                        
                       
                })
                   
                      
                }
                
            })
        }
    })
})
sw.get('/listperfil', function (req, res) {

    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send(`{${err}}`);
        } else {

            client.query('select p.id, p.descricao, 0 as funcionalidades from perfis p order by id asc;', async function (err, result) {

                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {

                    for (var i = 0; i < result.rows.length; i++) {

                        try {

                            pf = await client.query('select f.id, f.descricao from funcionalidades f, perfis_funcionalidades pf where pf.id_funcionalidade = f.id and pf.id_funcionalidade = $1', [result.rows[i].id])

                            result.rows[i].funcionalidades = pf.rows;

                        } catch (err) {
                            res.status(400).send(`{${err}}`)
                        }

                    }
                    done();
                    res.status(200).send(result.rows);
                }
            })

        }
    })
})

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
                    res.status(400).send(`{${err}}`);
                } else {

                    for (let index = 0; index < req.body.funcionalidades.length; index++) {

                        try {

                            await client.query('insert into perfis_funcionalidades (id_funcionalidade, id_perfil) values($1, $2)',
                                [
                                    req.body.funcionalidades[0].id, result.rows[0].id
                                ])


                        } catch (err) {
                            res.status(400).send(`{${err}}`);
                        }

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
sw.put('/updateperfil', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
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
                console.log("Erro no update perfis: " + err);
                res.status(400).send(`{${err}}`);
            } else {

                try {

                    await client.query('delete from perfis_funcionalidades pf where pf.id_perfil = $1 ',
                        [req.body.id])
                    for (let index = 0; index < req.body.funcionalidades.length; index++) {

                        try {

                            await client.query('insert into perfis_funcionalidades (id_funcionalidade, id_perfil) values ($1, $2) ',
                                [req.body.funcionalidades[index].id, result.rows[0].id])

                        } catch (err) {
                            res.status(400).send(`{${err}}`);
                        }

                    }
                } catch (err) {
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

sw.delete('/deleteperfil/:id', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados!" + err);
            res.status(400).send(`{${err}}`);
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
                    console.log(err);
                    res.status(400).send(`oi1 {${err}}`);
                } else {
                    client.query(q2, function (err, result) {
                        done();
                        if (err) {
                            console.log(err);
                            res.status(400).send(`oi2 {${err}}`);
                        } else {
                            res.status(200).send({ 'id': req.params.id });
                        }
                    })
                }
            });
        }
    });
});


sw.get('/funcionalidade/:id', function(req, res) {
    
    //estabelece uma conexao com o bd.
    postgres.connect(function(err, client, done) {
        
        if (err) {
            console.log("Não conseguiu acessar o BD :"+ err);
            res.status(400).send('{'+err+'}');
        } else {
            var q ={
                text: 'SELECT f.id, f.descricao' +
                'FROM funcionalidades f'+
                'where id = $1 order by f.id asc;',
                values: [req.params.id]
            }
            client.query(q, async function(err, result) {

                if (err) {
                    console.log(err);
                    res.status(500).send('{'+err+'}');
                } else {
                    
                    done();
                    res.status(200).send({
                        "id": result.rows[0].id,
                        "Descricao": result.rows[0].descricao,
                        
                       
                })
                   
                      
                }
                
            })
        }
    })
})
sw.get('/listfuncionalidade', function (req, res, next) {
    postgres.connect(function (err, client, done) {

        if (err) {
            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query('select id, descricao from funcionalidades order by id asc;', function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(result.rows)
                }
            })

        }
    })
})


sw.post('/insertfuncionalidade', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nõa conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: 'insert into funcionalidades (descricao) values($1) returning descricao',
                values: [req.body.descricao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {

                    console.log('retornou 201 no insertfuncionalidade');
                    res.status(201).send(result.rows[0]);
                }
            });
        }
    });
});

sw.post('/updatefuncionalidade', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: 'update funcionalidades set descricao=$1 where id = $2',
                values: [req.body.descricao, req.body.id]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {

                    console.log("Erro no update modo: " + err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send(req.body);
                }
            });
        }
    });
});

sw.get('/deletefuncionalidade/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: 'delete from funcionalidades where id =$1',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
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

            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'select r.id, '+
                'to_char(r.data_inicio, \'dd/mm/yyyy\') as data_inicio, '+
               'to_char(r.data_fim, \'dd/mm/yyyy\') as data_fim, '+
                'r.valor, r.valor_entrega, r.valor_total, r.observacoes, r.cliente, r.funcionario, r.status_reserva, 0 as produtos ' +
                'from reservas r ' +
                'where id = $1 '+
                'order by r.id asc;',
                values: [req.params.id]
            }
            client.query(q, async function(err, result) {

                if (err) {
                    console.log(err);
                    res.status(500).send('{'+err+'}');
                } else {
                    
                    done();
                    res.status(200).send({
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
                        
                       
                })
                   
                      
                }
                
            })
        }
    });
});

sw.get('/listreserva', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query('select r.id, '+
            'to_char(r.data_inicio, \'dd/mm/yyyy\') as data_inicio, '+
           'to_char(r.data_fim, \'dd/mm/yyyy\') as data_fim, '+
            'r.valor, r.valor_entrega, r.valor_total, r.observacoes, r.cliente, r.funcionario, r.status_reserva, 0 as produtos ' +
                'from reservas r ' +
                'order by r.id asc;', async function (err, result) {

                    if (err) {

                        console.log(err);
                        res.status(400).send(`{${err}}`);
                    } else {
                        for (let index = 0; index < result.rows.length; index++) {

                            try {

                                rp = await client.query('select p.id, p.descricao,  p.observacoes, p.valor_custo, p.valor_aluguel, p.valor_venda, p.tipo_produto from produtos p, ' +
                                    'reservas_produtos rp where rp.id_produto = p.id and rp.id_produto = $1', [result.rows[index].id])

                                result.rows[index].produtos = rp.rows;

                            } catch (err) {
                                res.status(400).send(`{${err}}`)
                            }

                        }
                        done();
                        res.status(200).send(result.rows);


                    }
                });
        }
    });
});

sw.delete('/deletereserva/:id', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Não conseguiu acessar o banco de dados!" + err);
            res.status(400).send(`{${err}}`);
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

                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    client.query(q2, function (err, result) {
                        if (err) {
                            console.log(err);
                            res.status(400).send(`{${err}}`);
                        } else {
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

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: 'insert into reservas (data_inicio, data_fim, valor, valor_entrega, valor_total, observacoes, cliente, funcionario, status_reserva) ' +
                    'values(now(),now(),$1, $2, $3, $4, $5, $6, $7) ' +
                    'returning id,  to_char(data_inicio, \'dd/mm/yyyy\') as data_inicio, to_char(data_fim, \'dd/mm/yyyy\'), valor, valor_entrega, valor_total, observacoes, cliente, funcionario, status_reserva',
                values: [req.body.valor,
                req.body.valor_entrega,
                req.body.valor_total,
                req.body.observacoes,
                req.body.cliente,
                req.body.funcionario,
                req.body.status_reserva]
            }
            console.log(q);

            client.query(q, async function (err, result) {

                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                } else {
                    for (let index = 0; index < req.body.produtos.length; index++) {

                        try {

                            await client.query('insert into reservas_produtos (id_reserva, id_produto) values($1, $2)',
                                [
                                    result.rows[0].id, req.body.produtos[0].id
                                ])


                        } catch (err) {
                            res.status(400).send(`{${err}}`);
                        }

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
sw.put('/updatereserva', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: 'update reservas set valor=$2, valor_entrega=$3, valor_total=$4, observacoes=$5, cliente=$6, funcionario=$7, status_reserva=$8 where id =$1 ' +
                    'returning id, to_char(data_inicio, \'dd/mm/yyyy\') as data_inicio, to_char(data_fim, \'dd/mm/yyyy\') as data_fim, ' +
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
                    console.log('retornou 400 no update');
                    console.log(err);
                } else {

                    try {
                        await client.query('delete from reservas_produtos rp where rp.id_reserva = $1',
                            [req.body.id])

                        for (let index = 0; index < array.length; index++) {
                            try {
                                await client.query('insert into reservas_produtos (id_reserva, id_produto) values($1, $2)',
                                    [
                                        result.rows[0].id, req.body.produtos[0].id
                                    ])
                            } catch (error) {
                                res.status(400).send(`{${err}}`);
                            }

                        }
                    } catch (err) {

                    }


                    done();
                    console.log('retornou 201 no updatereserva');
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

sw.get('/produto/:id', function(req, res) {
    postgres.connect(function (err, client, done) {
        
        if (err) {
            
            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'select id, descricao, observacoes, valor_custo, ' +
                'valor_aluguel, valor_venda ' +
                'from Produtos ' +
                'where id = $1 '+
                'order by id asc;',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insertproduto');
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    console.log('retornou 201 no insertproduto');
                    res.status(201).send(result.rows[0]);
                }
            });
        }
    })
})


sw.get('/listproduto', function (req, res) {
    postgres.connect(function (err, client, done) {

        if (err) {

            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query('select id, descricao, observacoes, valor_custo, ' +
                'valor_aluguel, valor_venda ' +
                'from Produtos ' +
                'order by id asc;', function (err, result) {
                    done();
                    if (err) {
                        console.log(err);
                        res.status(400).send(`{${err}}`);
                    } else {
                        console.log('retornou 200 no listproduto');
                        res.status(200).send(result.rows);
                    }
                });
        }
    });
});

sw.delete('/deleteproduto/:id', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: `delete from Produtos where id = $1`,
                values: [req.params.id]
            }

            client.query(q, function (err, result) {
                done(); // closing the connection;
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
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

            console.log("Nao conseguiu acessar o  BD " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {
                text: 'insert into Produtos (descricao, observacoes, valor_custo, valor_aluguel, valor_venda, tipo_produto) ' +
                    'values($1, $2, $3, $4, $5, $6) ' +
                    'returning descricao, observacoes, valor_custo, valor_aluguel, valor_venda, tipo_produto',
                values: [req.body.descricao,
                req.body.observacoes,
                req.body.valor_custo,
                req.body.valor_aluguel,
                req.body.valor_venda,
                req.body.tipo_produto]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insertproduto');
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    console.log('retornou 201 no insertproduto');
                    res.status(201).send(result.rows[0]);
                }
            });
        }
    });
});

sw.put('/updateproduto', (req, res) => {

    postgres.connect(function (err, client, done) {
        if (err) {

            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {

            var q = {

                text: 'update produtos set descricao=$2, observacoes=$3, valor_custo=$4, valor_aluguel=$5, valor_venda=$6, tipo_produto=$7 where id = $1 ',
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
                done();
                if (err) {
                    console.log("Erro no updateproduto: " + err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 200 no updateproduto');
                    res.status(200).send(req.body);
                }
            });
        }
    });
});

sw.get('/foto/:id', function(req, res) {
    postgres.connect(function (err, client, done) {
        
        if (err) {
            
            console.log("Não conseguiu acessar o BD :" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'select id, descricao, b64, produto_id, ' +
                'produto_id from Fotos ' +
                'where id = $1 '+
                'order by id asc;' ,
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insertfoto');
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
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
            console.log("Não conseguiu acessar o BD: " + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query('select id, descricao, b64, produto_id, ' +
                ' produto_id from Fotos order by id asc; ', function (err, result) {

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

sw.delete('/deletefoto/:id', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'delete from fotos where id = $1',
                values: [req.params.id]
            }

            client.query(q, function (err, result) {
                done(); // closing the connection;
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send({ 'id': req.params.id });//retorna o nickname deletado.
                }
            });
        }
    });
})

sw.post('/insertfoto', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'insert into fotos (descricao, b64, produto_id) ' +
                    'values ($1, $2, $3) ' +
                    'returning id, descricao, b64, produto_id',
                values: [
                    req.body.descricao,
                    req.body.b64,
                    req.body.produto_id
                ]

            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insertfoto');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
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
    });
});

sw.put('/updatefoto', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
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
                done();
                if (err) {
                    console.log('retornou 400 no update ');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no updatefoto');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});

sw.get('/tiposproduto/:id', function(req, res) {
    if (err) {
            
        console.log("Não conseguiu acessar o BD :" + err);
        res.status(400).send(`{${err}}`);
    } else {
        var q = {
            text: 'select id, nome ' +
            'from tiposProduto ' +
            'where id = $1'+
            'order by id asc;' ,
            values: [req.params.id]
        }
        client.query(q, function (err, result) {
            done();
            if (err) {
                console.log('retornou 400 no insertfoto');
                console.log(err);
                res.status(400).send(`{${err}}`)
            } else {
                console.log('retornou 201 no insertfoto');
                res.status(201).send({
                    "id": result.rows[0].id,
                    "descricao": result.rows[0].nome,
                });
            }
        });
    }
})


sw.get('/listtipoproduto', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            client.query('select id, nome ' +
                'from tiposProduto ' +
                'order by id asc;', function (err, result) {
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

sw.delete('/deletetipoproduto/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log(err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'delete from tiposProduto where id = $1',
                values: [req.params.id]
            }
            client.query(q, function (err, client) {
                done(); // closing the connection;
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    res.status(200).send({ 'id': req.params.id });//retorna o nickname deletado.
                }

            });
        }
    });
});

sw.post('/inserttipoproduto', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
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
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no inserttipoproduto');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.put('/updatetipoproduto', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'update tiposProduto set nome=$2 where id = $1',
                values: [
                    req.body.id,
                    req.body.nome
                ]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no update ');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertmodo');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});

sw.get('/locacao/:id', function(req, res) {
    postgres.connect(function(err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            q = {
                text: 'select id, '+
                'to_char(data_retirada, \'dd/mm/yyyy\') as data_retirada, '+
                'to_char(data_previsao_entrega, \'dd/mm/yyyy\') as data_previsao_entrega, '+
                'to_char(data_entrega, \'dd/mm/yyyy\') as data_entrega, ' +
                'to_char(data_previsao_pagamento, \'dd/mm/yyyy\') as data_previsao_pagamento, '+
                'valor_total, valor_pago, observacoes, funcionario, tipos_pagamento, 0 as reservas ' +
                'from locacoes ' +
                'where id = $1 '+
                'order by id;',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no locacao');
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    console.log('retornou 201 no locacao');
                    res.status(200).send(result.rows);
                }
            });
        }
    })
})

sw.get('/listlocacao', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {

            client.query('select id, '+
            'to_char(data_retirada, \'dd/mm/yyyy\') as data_retirada, '+
            'to_char(data_previsao_entrega, \'dd/mm/yyyy\') as data_previsao_entrega, '+
            'to_char(data_entrega, \'dd/mm/yyyy\') as data_entrega, ' +
            'to_char(data_previsao_pagamento, \'dd/mm/yyyy\') as data_previsao_pagamento, '+
            'valor_total, valor_pago, observacoes, funcionario, tipos_pagamento, 0 as reservas ' +
            'from locacoes ' +
            'order by id;', async function (err, result) {

                    if (err) {
                        console.log(err);
                        res.status(400).send(`{${err}}`);
                    } else {

                        for (let index = 0; index < result.rows.length; index++) {
                            try {
                                lr = await client.query('select r.id, '+
                               'to_char(r.data_inicio, \'dd/mm/yyyy\') as data_inicio, '+
                                'to_char(r.data_fim, \'dd/mm/yyyy\') as data_fim, ' +
                                'r.valor, r.valor_entrega, r.valor_total, r.observacoes, r.cliente, r.funcionario, r.status_reserva ' +
                                    'from reservas r, locacoes_reservas lr ' +
                                    'where lr.id_reserva = r.id and lr.id_reserva = $1 ', [result.rows[index].id])

                                result.rows[index].reservas = lr.rows


                            } catch (error) {
                                res.status(400).send(`{${err}}`);
                            }

                        }
                        done();
                        res.status(200).send(result.rows);
                    }
                });

        }
    });

});

sw.delete('/deletelocacao/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log(err);
            res.status(400).send(`{${err}}`);
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
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {

                    client.query(q2, function (err, result) {
                        done();
                        if (err) {
                            console.log(err);
                            res.status(400).send(`{${err}}`);
                        } else {
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
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'insert into locacoes (data_retirada, data_previsao_entrega, data_entrega, data_previsao_pagamento, valor_total, valor_pago, observacoes, funcionario, tipos_pagamento) ' +
                    ' values(now(), now(), now(), now(), $1, $2, $3, $4, $5) ' +
                    'returning id, to_char(data_retirada, \'dd/mm/yyyy\') as data_retirada , ' +
                    ' to_char(data_previsao_entrega, \'dd/mm/yyyy\') as data_previsao_entrega, ' +
                    'to_char(data_entrega, \'dd/mm/yyyy\') as data_entrega, ' +
                    'to_char(data_previsao_pagamento, \'dd/mm/yyyy\') as data_previsao_pagamento, ' +
                    'valor_total, valor_pago, observacoes, funcionario, tipos_pagamento',
                values: [
                req.body.valor_total,
                req.body.valor_pago,
                req.body.observacoes, 
                req.body.funcionario, 
                req.body.tipos_pagamento]
            }
            console.log(q);

            client.query(q, async function (err, result) {

                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    for (let index = 0; index < req.body.reservas.length; index++) {
                        try {

                            await client.query('insert into locacoes_reservas (id_locacao, id_reserva ) values($1, $2)',
                                [
                                    result.rows[0].id, req.body.reservas[0].id
                                ])

                        } catch (err) {

                            res.status(400).send(`{${err}}`);
                        }

                    }
                    done();
                    console.log('retornou 201 no insertlocacao');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.put('/updatelocacao', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'update locacoes set valor_total=$2, valor_pago=$3, observacoes=$4, funcionario=$5, tipos_pagamento=$6 where id = $1 '+
                      'returning id, to_char(data_retirada, \'dd/mm/yyyy\') as data_retirada , ' +
                      ' to_char(data_previsao_entrega, \'dd/mm/yyyy\') as data_previsao_entrega, ' +
                      'to_char(data_entrega, \'dd/mm/yyyy\') as data_entrega, ' +
                      'to_char(data_previsao_pagamento, \'dd/mm/yyyy\') as data_previsao_pagamento, ' +
                      'valor_total, valor_pago, observacoes, funcionario, tipos_pagamento',
                values: [
                    req.body.id,
                    req.body.valor_total,
                    req.body.valor_pago,
                    req.body.observacoes,
                    req.body.funcionario,
                    req.body.tipos_pagamento]
            }
            console.log(q);

            client.query(q, async function (err, result) {

                if (err) {
                    console.log('retornou 400 no update ');
                    res.status(400).send(`{${err}}`);
                } else {

                    try {

                        await client.query('delete from locacoes_reservas lr where id_locacao = $1', [req.body.id])

                        for (let index = 0; index < req.body.reservas.length; index++) {
                            try {

                                await client.query('insert into locacoes_reservas (id_locacao, id_reserva) values($1, $2)',
                                    [
                                        result.rows[0].id, 
                                        req.body.reservas[0].id
                                    ]);

                            } catch (err) {
                                res.status(400).send(`{${err}}`);
                            }

                        }
                    } catch (err) {
                        res.status(400).send(`{${err}}`);
                    }

                    done();
                    console.log('retornou 201 no updatelocacao');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});

sw.get('/parcelamento/:id', function(req, res) {
    postgres.connect(function(err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            q = {
                text: 'select id, numero_parcela, '+
                'to_char(data_previsao_pagamento, \'dd/mm/yyyy\') as data_previsao_pagamento, '+
                'to_char(data_pagamento, \'dd/mm/yyyy\') as data_pagamento, '+
                 'valor_total, valor_pago, id_locacao ' +
                'from parcelamentos ' +
                'where id = $1 '+
                 'order by id',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no parcelamento');
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    console.log('retornou 201 no parcelamento');
                    res.status(200).send(result.rows);
                }
            });
        }
    })
})

sw.get('/listparcelamento', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {

            client.query('select id, numero_parcela, '+
           'to_char(data_previsao_pagamento, \'dd/mm/yyyy\') as data_previsao_pagamento, '+
           'to_char(data_pagamento, \'dd/mm/yyyy\') as data_pagamento, '+
            'valor_total, valor_pago, id_locacao ' +
                'from parcelamentos ' +
                'order by id', function (err, result) {
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

sw.delete('/deleteparcelamento/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log(err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: 'delete from parcelamentos where id = $1',
                values: [req.params.id]
            }


            client.query(q1, function (err, result) {

                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    res.status(200).send({ 'id': req.params.id })
                }
            })
        }
    });
});

sw.post('/insertparcelamento', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'insert into parcelamentos (numero_parcela, data_previsao_pagamento, data_pagamento, valor_total, valor_pago, id_locacao) ' +
                    'values($1, $2, $3, $4, $5, $6) ' +
                    'returning numero_parcela, '+
                        'to_char(data_previsao_pagamento, \'dd/mm/yyyy\') , '+
                        'to_char(data_pagamento, \'dd/mm/yyyy\') , '+
                        'valor_total, valor_pago, id_locacao',
                values: [
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
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertparcelamento');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.put('/updateparcelamento', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'update parcelamentos set numero_parcela=$2, data_previsao_pagamento=$3, data_pagamento=$4, valor_total=$5, valor_pago=$6, id_locacao=$7 where id=$1 '+
                'returning numero_parcela, '+
                        'to_char(data_previsao_pagamento, \'dd/mm/yyyy\') ,'+
                        'to_char(data_pagamento, \'dd/mm/yyyy\') ,'+
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
                    console.log('retornou 400 no update ');
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no updateparcelamento');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});


sw.get('/sitacao/:id', function(req, res) {
    postgres.connect(function(err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            q = {
                text: 'select id, descricao ' +
                'from sitacao ' +
                'where id = $1 '+
                'order by id ',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no sitacao');
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    console.log('retornou 201 no sitacao');
                    res.status(200).send(result.rows);
                }
            });
        }
    })
})

sw.get('/listsitacao', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {

            client.query('select id, descricao ' +
                'from sitacao ' +
                'order by id ', function (err, result) {
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

sw.delete('/deletesitacao/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log(err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: 'delete from sitacao where id= $1',
                values: [req.params.id]
            }


            client.query(q1, function (err, result) {

                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    res.status(200).send({ 'id': req.params.id })
                }
            })
        }
    });
});

sw.post('/insertsitacao', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'insert into sitacao (descricao) ' +
                    'values($1) ' +
                    ' returning descricao',
                values: [req.body.descricao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertsitacao');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.put('/updatesitacao', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'update sitacao set descricao=$2 where id= $1 '+
                       'returning id, descricao',
                values: [
                    req.body.id,
                    req.body.descricao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no update ');
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no updatesitacao');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});

sw.get('/acompanhamento/:id', function(req, res) {
    postgres.connect(function(err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            q = {
                text: 'select id, sequencia_passo, '+
                'to_char(data, \'dd/mm/yyyy\') as data, '+
                'observacoes, id_sitacao, id_locacao ' +
                'from acompanhamento ' +
                'where id = $1 '+
                'order by id; ',
                values: [req.params.id]
            }
            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no acompanhamento');
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    console.log('retornou 201 no acompanhamento');
                    res.status(200).send(result.rows);
                }
            });
        }
    })
})

sw.get('/listacompanhamento', function (req, res) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {

            client.query('select id, sequencia_passo, '+
            'to_char(data, \'dd/mm/yyyy\') as data, '+
            'observacoes, id_sitacao, id_locacao ' +
                'from acompanhamento ' +
                'order by id; ', function (err, result) {
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

sw.delete('/deletedacompanhamento/:id', function (req, res, next) {

    postgres.connect(function (err, client, done) {
        if (err) {
            console.log(err);
            res.status(400).send(`{${err}}`);
        } else {
            var q1 = {
                text: 'delete from acompanhamento where id = $1',
                values: [req.params.id]
            }


            client.query(q1, function (err, result) {
                done();
                if (err) {
                    console.log(err);
                    res.status(400).send(`{${err}}`)
                } else {
                    res.status(200).send({ 'id': req.params.id })
                }
            })
        }
    });
});

sw.post('/insertacompanhamento', function (req, res, next) {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'insert into acompanhamento (sequencia_passo, data, observacoes, id_sitacao, id_locacao) ' +
                    'values($1, $2, $3, $4, $5) ' +
                    'returning sequencia_passo, '+
                        'to_char(data, \'dd/mm/yyyy\'), '+
                        'observacoes, id_sitacao, id_locacao',
                values: [
                    req.body.sequencia_passo,
                    req.body.data,
                    req.body.observacoes,
                    req.body.id_sitacao,
                    req.body.id_locacao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no insert');
                    console.log(err);
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no insertacompanhamento');
                    res.status(201).send(result.rows[0]);
                }

            });
        }
    });
});

sw.put('/updateacompanhamento', (req, res) => {
    postgres.connect(function (err, client, done) {
        if (err) {
            console.log("Não conseguiu acessar o banco de dados" + err);
            res.status(400).send(`{${err}}`);
        } else {
            var q = {
                text: 'update acompanhamento set  sequencia_passo=$2, data=$3, observacoes=$4, id_sitacao=$5, id_locacao=$6 where id = $1 '+
                'returning sequencia_passo, '+
                        'to_char(data, \'dd/mm/yyyy\') , '+
                        'observacoes, id_sitacao, id_locacao',
                values: [
                    req.body.id,
                    req.body.sequencia_passo,
                    req.body.data,
                    req.body.observacoes,
                    req.body.id_sitacao,
                    req.body.id_locacao]
            }
            console.log(q);

            client.query(q, function (err, result) {
                done();
                if (err) {
                    console.log('retornou 400 no update ');
                    res.status(400).send(`{${err}}`);
                } else {
                    console.log('retornou 201 no updateacompanhamento');
                    res.status(200).send(req.body);
                }

            });
        }
    });
});


sw.listen(4000, function () {
    console.log('Server is running.. on Port 4000')
})
