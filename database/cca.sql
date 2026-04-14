create database cca;
use cca;

create table users(
	userID int primary key auto_increment not null,
    userName varchar(25) not null,
    userEmail varchar(30) not null unique,
    userPhone int not null,
    userRole enum('Driver', 'Passenger') default 'Passenger',
    userKey varchar(500) not null
);

create table routes(
	routeID int primary key not null auto_increment,
    userID int not null,
    startPoint varchar(50) not null,
    endPoint varchar(50) not null,
    duration varchar(15) not null,
    price int not null,
    availableSeats int not null,
    remainingSeats int not null,
    
    foreign key (userID) references users(userID) on delete cascade
);

create table bookings(
	bookID int primary key not null auto_increment,
    userID int not null,
    routeID int not null,
    available_seats int not null,
    remaining_seats int not null,
    
    foreign key (userID) references users(userID) on delete cascade,
    foreign key (routeID) references routes(routeID) on delete cascade
);

create table sessions(
	sessID int auto_increment primary key,
    userID int not null,
    bookID int not null,
    startTime timestamp default current_timestamp,
    endTime timestamp default current_timestamp,
    
    foreign key (userID) references users(userID) on delete cascade,
    foreign key (bookID) references bookings(bookID) on delete cascade
);