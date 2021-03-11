import { Request, Response } from 'express';

import database from '../database/connection';

// Importando conversão de Horas em Minutos
import convertHourToMinutes from '../utils/convertHourToMinutes';

interface ScheduleItem {
    week_day: number;
    from: string;
    to: string;
}

export default class ClassesController {
    async index(request: Request, response: Response) {
        const filters = request.query;

        const subject = filters.subject as string;
        const week_day = filters.week_day as string;
        const time = filters.time as string;

        // Verificando se caso o usuário não informar os dados (dia, matéria e data)
        if (!filters.week_day || !filters.subject || !filters.time) {
            return response.status(400).json({
                error: 'Missing filters to search classes'
            })
        }

        // Função de converter Horas em Minutos
        const timeInMinutes = convertHourToMinutes(time);

        const classes = await database('classes')
            .whereExists(function() {
                this.select('class_schedule.*')
                    .from('class_schedule')
                    .whereRaw('`class_schedule`.`class_id` = `classes`.`id`')
                    .whereRaw('`class_schedule`.`week_day` = ??', [Number(week_day)])
                    .whereRaw('`class_schedule`.`from` <= ??', [timeInMinutes])
                    .whereRaw('`class_schedule`.`to` > ??', [timeInMinutes])
            })
            .where('classes.subject', '=', subject)
            .join('users', 'classes.user_id', '=', 'users.id')
            .select(['classes.*', 'users.*']);

        // Verificação se tem horário disponível para o usuário agendar aula
        

        return response.json(classes);
    }

    async create(request: Request, response: Response) {
        const {
            name, 
            avatar, 
            whatsapp, 
            bio, 
            subject, 
            cost, 
            schedule
        } = request.body;
    
        // Fazendo transações do banco
        const trx = await database.transaction();
    
        // Tentando fazer o código (try) > se não mostrar erro (catch)
        try {
            // Inserindo dados da tabela 'users'
            const insertedUsersIds = await trx('users').insert({
                name, 
                avatar, 
                whatsapp, 
                bio,
            });
    
            // Pegando o primeiro 'ID' da tabela de 'users'
            const user_id = insertedUsersIds[0];
    
            // Inserindo dados da tabela 'classes'
            const insertedClassesIds = await trx('classes').insert({
                subject, 
                cost,
                user_id,
            });
    
            // Pegando o primeiro 'ID' da tabela 'classes'
            const class_id = insertedClassesIds[0];
    
            // Agendamento da classe (Schedule)
            const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
                return {
                    class_id,
                    week_day: scheduleItem.week_day,
                    from: convertHourToMinutes(scheduleItem.from),
                    to: convertHourToMinutes(scheduleItem.to),
                };
            })
    
            // Inserindo 'classSchedule' na tabela 'class_schedule'
            await trx('class_schedule').insert(classSchedule);
    
            // Fazendo alterações com 'trx' ao inserir no banco de dados
            await trx.commit();
    
            // Retornando uma resposta
            return response.status(201).send();
            
        } catch (err) {
            await trx.rollback();
    
            return response.status(400).json({
                error: 'Unexpected error white creating new class'
            })
        }
    }
}