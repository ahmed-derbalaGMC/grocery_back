/**
 * this file contains messages (outputs to user) based on language
 */

exports.msg_vacationRequest = (user, vacation, lang) => {
    if (!lang || lang == 'en') {
        return `${user.firstName} ${user.lastName} requested a vacation with reason.`
    }
    if (lang == 'fr') {
        return `${user.firstName} ${user.lastName} a fait une demande de congé.`
    }
}

exports.msg_vacationAnswered = (user, vacation, lang) => {
    if (!lang || lang == 'en') {
        return `your ${vacation.reason} is ${vacation.status}`
    }
    if (lang == 'fr') {
        if (vacation.status == 'accepted')
            return `Votre demande de congé a été accepté.`
        if (vacation.status == 'refused')
            return `Votre demande de congé a été refusé.`
        if (vacation.status == 'pending')
            return `Votre demande de congé est enutils en attente de decision.`
    }
}

exports.msg_replacementRequest = (user, lang) => {
    if (!lang || lang == 'en') {
        return `${user.firstName} ${user.lastName} requested a replacement`
    }
    if (lang == 'fr') {
        return `${user.firstName} ${user.lastName} a fait une demande de remplacement`
    }
}

exports.msg_replacementAnswer = (user, lang) => {
    if (!lang || lang == 'en') {
        return `${user.firstName} ${user.lastName} answerd a replacement`
    }
    if (lang == 'fr') {
        return `${user.firstName} ${user.lastName} a repondu a un remplacement`
    }
}

exports.msg_replacementOpinion = (user, lang) => {
    if (!lang || lang == 'en') {
        return `${user.firstName} ${user.lastName} answerd a replacement`
    }
    if (lang == 'fr') {
        return `${user.firstName} ${user.lastName} a repondu a un remplacement`
    }
}

exports.msg_eventCreated = (event, lang) => {
    if (!lang || lang == 'en') {
        return `the event ${event.subject} is updated`
    }
    if (lang == 'fr') {
        // let invite = 'invité'
        //if (user.gender == 'female') invite = 'invitée'
        return `Vous êtes invité(e) à l'événement ${event.subject}`
    }
}

exports.msg_eventUpdated = (event, lang) => {
    if (!lang || lang == 'en') {
        return `the event ${event.subject} is updated`
    }
    if (lang == 'fr') {
        return `L'événement ${event.subject} a été mis à jour`
    }
}

exports.msg_atworkEmployees = (lang) => {
    if (!lang || lang == 'en') {
        return `onsite employees`
    }
    if (lang == 'fr') {
        return `salariés présents`
    }
}

exports.msg_model = (mymodel, lang) => {
    if (mymodel == 'team') {
        if (!lang || lang == 'en') {
            return `Team`
        }
        if (lang == 'fr') {
            return `Equipe`
        }
    }
    if (mymodel == 'department') {
        if (!lang || lang == 'en') {
            return `Department`
        }
        if (lang == 'fr') {
            return `Département`
        }
    }

    if (mymodel == 'division') {
        if (!lang || lang == 'en') {
            return `Division`
        }
        if (lang == 'fr') {
            return `Division`
        }
    }

    if (mymodel == 'enterprise') {
        if (!lang || lang == 'en') {
            return `Enterprise`
        }
        if (lang == 'fr') {
            return `Entreprise`
        }
    }

    if (mymodel == 'pharmacy') {
        if (!lang || lang == 'en') {
            return `Pharmacy`
        }
        if (lang == 'fr') {
            return `Pharmacie`
        }
    }
}

exports.msg_noEmployeesMatchingWeekWorkHours = (lang, weekWorkHours) => {
    if (!lang || lang == 'en') {
        return `you have no employees working (${weekWorkHours}h) hours per week`
    }
    if (lang == 'fr') {
        return `Le nombre d'heures (${weekWorkHours}h) du planning ne correspond à aucun salalrié`
    }
}

exports.msg_WelcomeWorkFirstTime = (user, lang) => {
    if (!lang || lang == 'en') {
        return `welcome ${user.firstName} ${user.lastName}, we wish a fresh start for you!`
    }
    if (lang == 'fr') {
        return `Bienvenu ${user.firstName} ${user.lastName}, on souhaite une bonne debut de carriere`
    }
}

exports.msg_WelcomeWorkFirstTimeError = (user, lang) => {
    if (!lang || lang == 'en') {
        return `Welcome ${user.firstName} ${user.lastName}, you had never been at work but you requested to leave!`
    }
    if (lang == 'fr') {
        return `Bienvenu ${user.firstName} ${user.lastName}, vous n'aviez jamais au travaille mais vous avez demander de quitter`
    }
}

exports.msg_WelcomeWork = (user, lang) => {
    if (!lang || lang == 'en') {
        return `Welcome ${user.firstName} ${user.lastName}`
    }
    if (lang == 'fr') {
        return `Bienvenu ${user.firstName} ${user.lastName}`
    }
}

exports.msg_WelcomeWorkError = (user, lang) => {
    if (!lang || lang == 'en') {
        return `Hi ${user.firstName} ${user.lastName}, you already checked at work but you requested to check at work! Welcome`
    }
    if (lang == 'fr') {
        return `Bonjour ${user.firstName} ${user.lastName}, vous etes deja au travaille mais vous avez demander de marquer au travaille! Bienvenu`
    }
}

exports.msg_GoodByeWork = (user, lang) => {
    if (!lang || lang == 'en') {
        return `GoodBye ${user.firstName} ${user.lastName}`
    }
    if (lang == 'fr') {
        return `A bientot ${user.firstName} ${user.lastName}`
    }
}

exports.msg_GoodByeWorkError = (user, lang) => {
    if (!lang || lang == 'en') {
        return `${user.firstName} ${user.lastName}, you already not at work and you requested to leave. GoodBye`
    }
    if (lang == 'fr') {
        return `${user.firstName} ${user.lastName}, vous etes deja au travaille mais vous avez demander de quitter. A bientot`
    }
}

exports.msg_UserNotFound = (email, lang) => {
    if (!lang || lang == 'en') {
        return `The user with email=${email} not exist or not active`
    }
    if (lang == 'fr') {
        return `L'utilisateur avec email=${email} n'existe pas ou n'est pas active`
    }
}

exports.msg_NewUserRegistered = (user, newUser, lang) => {
    if (!lang || lang == 'en') {
        return `${user.firstName} ${user.lastName} registered ${newUser.firstName} ${newUser.lastName}`
    }
    if (lang == 'fr') {
        return `${user.firstName} ${user.lastName} a cree un compte pour ${newUser.firstName} ${newUser.lastName}`
    }
}


exports.msg_ConstraintError = (jobCounts, jobNames, jobConstraints, fromwn, town, lang) => {
    if (!lang || lang == 'en') {
        return `there are ${jobCounts} ${jobNames} available but ${jobConstraints} is required in the constraint \n`
    }
    if (lang == 'fr') {
        return `Vous allez affecter ce planning à ${jobCounts} ${jobNames} pour la période des semaine ${fromwn}-${town}. Il vous en reste ${jobConstraints - jobCounts} salariés d'après les contraintes de votre entreprise.`
    }
}

exports.msg_NoWorkdays = (lang) => {
    if (!lang || lang == 'en') {
        return `Your employees dont have plannings yet`
    }
    if (lang == 'fr') {
        return `Vos salaries ont aucun planning`
    }
}

exports.msg_EmployeesCountConstraint = (employeesCount, count, lang) => {
    if (!lang || lang == 'en') {
        return `the entreprise requires at least ${employeesCount} to generate plannings but you selected only ${count}`
    }
    if (lang == 'fr') {
        return `l'entreprise demande au minimum ${employeesCount} pour generer un planning mais vous avez selectionner ${count} `
    }
}

exports.msg_NewEntrepriseCreated = (user, entreprise, lang) => {
    if (!lang || lang == 'en') {
        return `New entreprise ${entreprise.name} created by ${user.firstName} ${user.lastName}`
    }
    if (lang == 'fr') {
        return `Une nouvelle entreprise ${entreprise.name} a été créée par ${user.firstName} ${user.lastName}`
    }
}

exports.msg_PasswordGenerated = (user, lang) => {
    if (!lang || lang == 'en') {
        return `Hi ${user.firstName} ${user.lastName}, a new password was generated successfully and sent to your inbox`
    }
    if (lang == 'fr') {
        return `Bonjour ${user.firstName} ${user.lastName}, un nouveau mot de passe est genere et envoye a votre inbox`
    }
}

exports.msg_SomeWorkdaysAlreadyExist = (lang) => {
    if (!lang || lang == 'en') {
        return `some workdays couldnt be saved because its already exist`
    }
    if (lang == 'fr') {
        return `Il ya deja des plannings generes pour certain jours`
    }
}

exports.msg_CheckedIn = (lang) => {
    if (!lang || lang == 'en') {
        return `checked in,`
    }
    if (lang == 'fr') {
        return `est au travail,`
    }
}

exports.msg_CheckedOut = (lang) => {
    if (!lang || lang == 'en') {
        return `checked out,`
    }
    if (lang == 'fr') {
        return `a quitté le travail,`
    }
}

exports.msg_TookBreak = (lang) => {
    if (!lang || lang == 'en') {
        return ` took a break`
    }
    if (lang == 'fr') {
        return ` a pris une pause`
    }
}

exports.msg_CameBackFromBreak = (lang) => {
    if (!lang || lang == 'en') {
        return ` Came Back From Break`
    }
    if (lang == 'fr') {
        return ` a fini sa pause`
    }
}

exports.msg_replacedBy = (lang) => {
    if (!lang || lang == 'en') {
        return ` replaced by`
    }
    if (lang == 'fr') {
        return ` a été remplacé par`
    }
}

exports.msg_replaced = (lang) => {
    if (!lang || lang == 'en') {
        return ` replaced`
    }
    if (lang == 'fr') {
        return ` a remplacé`
    }
}

exports.msg_from = (lang) => {
    if (!lang || lang == 'en') {
        return ` from `
    }
    if (lang == 'fr') {
        return ` de `
    }
}

exports.msg_to = (lang) => {
    if (!lang || lang == 'en') {
        return ` to `
    }
    if (lang == 'fr') {
        return ` jusqu'à `
    }
}

/*exports.msg_UserAttendance = (atWork,inBreak,lang) => {
    if (!lang || lang == 'en') {
        if (atWork && atWork == true) {
            if (inBreak)
        }
        return ` Came Back From Break`
    }
    if (lang == 'fr') {
        return ` a fini sa pause`
    }
}
*/
