'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import styles from "./HomeScreen.module.scss"
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const HomeScreen = ({ websocketId: propWebsocketId }) => {
    // State для хранения данных WebSocket
    const [orderData, setOrderData] = useState({
        id: 0,
        client_name: "",
        client_phone: "",
        employee_name: "",
        package_details: [],
        total_price: "0.00",
        status: "pending",
        created_at: "",
        updated_at: "",
        queue_position: 0
    });

    // Статус соединения
    const [connected, setConnected] = useState(false);

    // Состояние ошибки
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Отслеживание прогресса
    const [progress, setProgress] = useState(0);
    const [remainingTime, setRemainingTime] = useState(60);

    // Для отслеживания попыток переподключения
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const maxReconnectAttempts = 5;

    // Функция для создания WebSocket соединения

    // РАСКОМЕНТИТЬ
    // const createWebSocketConnection = useCallback((wsId) => {
    //     if (!wsId) {
    //         console.error('ID заказа не найден');
    //         setError('Не удалось найти ID заказа. Пожалуйста, отсканируйте QR-код снова.');
    //         setLoading(false);
    //         return null;
    //     }

    //     console.log('WebSocket ID найден:', wsId);

    //     // Используем фиксированный URL для WebSocket сервера
    //     // Поскольку мы теперь работаем локально на порту 3001
    //     const wsUrl = `ws://84.54.12.243/ws/order/${wsId}/`;
    //     console.log('Подключение к WebSocket:', wsUrl);

    //     let socket;
    //     try {
    //         socket = new WebSocket(wsUrl);
    //         console.log('WebSocket создан');
    //     } catch (err) {
    //         console.error('Ошибка создания WebSocket:', err);
    //         setError('Не удалось подключиться к серверу. Пожалуйста, проверьте соединение и попробуйте снова.');
    //         setLoading(false);
    //         return null;
    //     }

    //     // Устанавливаем таймаут на подключение
    //     const connectionTimeout = setTimeout(() => {
    //         if (!connected) {
    //             console.error('Превышено время ожидания WebSocket подключения');
    //             socket.close();

    //             // Пробуем переподключиться, если не превысили максимальное количество попыток
    //             if (reconnectAttempt < maxReconnectAttempts) {
    //                 console.log(`Попытка переподключения ${reconnectAttempt + 1} из ${maxReconnectAttempts}`);
    //                 setReconnectAttempt(prev => prev + 1);
    //                 // Не показываем ошибку при переподключении
    //             } else {
    //                 setError('Превышено время ожидания подключения. Пожалуйста, попробуйте позже.');
    //                 setLoading(false);
    //             }
    //         }
    //     }, 10000); // 10 секунд таймаут

    //     // Успешное подключение
    //     socket.onopen = () => {
    //         console.log('WebSocket соединение установлено');
    //         clearTimeout(connectionTimeout);
    //         setConnected(true);
    //         setLoading(false);
    //         setReconnectAttempt(0); // Сбрасываем счетчик попыток
    //     };

    //     // Получение сообщений
    //     socket.onmessage = (event) => {
    //         try {
    //             const data = JSON.parse(event.data);
    //             console.log('Получены данные:', data);
    //             setOrderData(data);

    //             // Расчет прогресса на основе статуса
    //             if (data.status === "in_progress") {
    //                 const createdTime = new Date(data.created_at);
    //                 const now = new Date();
    //                 const elapsedMinutes = Math.floor((now - createdTime) / (1000 * 60));

    //                 // Предполагаем, что полный сервис занимает 60 минут
    //                 const totalServiceTime = 60;
    //                 const newProgress = Math.min(Math.floor((elapsedMinutes / totalServiceTime) * 100), 99);
    //                 setProgress(newProgress);

    //                 // Оставшееся время
    //                 const remainingMins = Math.max(totalServiceTime - elapsedMinutes, 0);
    //                 setRemainingTime(remainingMins);
    //             } else if (data.status === "completed") {
    //                 setProgress(100);
    //                 setRemainingTime(0);
    //             } else if (data.status === "pending") {
    //                 // Для ожидающих заказов показываем начальный прогресс
    //                 setProgress(5);
    //                 setRemainingTime(60);
    //             }
    //         } catch (error) {
    //             console.error('Ошибка обработки данных:', error);
    //         }
    //     };

    //     // Обработка ошибок
    //     socket.onerror = (error) => {
    //         console.error('Ошибка WebSocket:', error);
    //         setConnected(false);

    //         // При ошибке WebSocket попытаемся переподключиться
    //         if (reconnectAttempt < maxReconnectAttempts) {
    //             console.log(`Ошибка соединения. Попытка переподключения ${reconnectAttempt + 1} из ${maxReconnectAttempts}`);
    //             setReconnectAttempt(prev => prev + 1);
    //         } else {
    //             setError('Произошла ошибка при подключении к серверу. Пожалуйста, попробуйте позже.');
    //             setLoading(false);
    //         }
    //     };

    //     // Обработка закрытия соединения
    //     socket.onclose = (event) => {
    //         console.log(`WebSocket соединение закрыто. Код: ${event.code}, Причина: ${event.reason}`);
    //         setConnected(false);

    //         // При закрытии WebSocket пытаемся переподключиться
    //         if (reconnectAttempt < maxReconnectAttempts) {
    //             console.log(`Соединение закрыто. Попытка переподключения ${reconnectAttempt + 1} из ${maxReconnectAttempts}`);
    //             setReconnectAttempt(prev => prev + 1);
    //         } else if (loading) {
    //             setError('Соединение закрыто. Не удалось получить данные заказа.');
    //             setLoading(false);
    //         }
    //     };

    //     return { socket, connectionTimeout };
    // }, [connected, reconnectAttempt, loading]);

    // РАСКОМЕНТИТЬ

    // useEffect(() => {
    //     // Определяем ID заказа
    //     let websocketId = propWebsocketId; // Сначала используем prop, если передан

    //     if (!websocketId) {
    //         // Проверяем hash в URL
    //         if (window.location.hash && window.location.hash.length > 1) {
    //             websocketId = window.location.hash.substring(1);
    //             console.log("ID получен из hash:", websocketId);
    //         }

    //         // Проверяем query параметры
    //         if (!websocketId) {
    //             const urlParams = new URLSearchParams(window.location.search);
    //             websocketId = urlParams.get('id');
    //             console.log("ID получен из query params:", websocketId);
    //         }

    //         // Проверяем, не находимся ли мы на пути /track/ID
    //         if (!websocketId && window.location.pathname.startsWith('/track/')) {
    //             const pathParts = window.location.pathname.split('/');
    //             if (pathParts.length >= 3) {
    //                 websocketId = pathParts[2];
    //                 console.log("ID получен из path:", websocketId);
    //             }
    //         }
    //     } else {
    //         console.log("ID получен из props:", websocketId);
    //     }

    //     let socketData = null;

    //     // Создаем новое соединение
    //     socketData = createWebSocketConnection(websocketId);

    //     // Функция очистки
    //     return () => {
    //         if (socketData) {
    //             clearTimeout(socketData.connectionTimeout);
    //             socketData.socket?.close();
    //         }
    //     };
    // }, [propWebsocketId, createWebSocketConnection, reconnectAttempt]);

    // Форматирование номера телефона
    const formatPhone = (phone) => {
        if (!phone) return "";
        return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    };

    // Получение названия пакета
    const getPackageName = () => {
        if (orderData.package_details && orderData.package_details.length > 0) {
            return orderData.package_details[0].name;
        }
        return "Нет данных";
    };

    // Форматирование времени как mm:ss
    const formatTime = (minutes) => {
        const mins = Math.floor(minutes);
        const secs = Math.floor((minutes - mins) * 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Получение текста статуса на русском
    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Ожидание';
            case 'in_progress': return 'В процессе';
            case 'completed': return 'Завершено';
            default: return 'Статус неизвестен';
        }
    };

    // Получение классов цветов для статуса
    const getStatusClasses = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Если загрузка или ошибка, показываем соответствующий экран

    // РАСКОМЕНТИТЬ

    // if (loading) {
    //     return (
    //         <div className="flex justify-center items-center bg-slate-900 w-full min-h-screen">
    //             <div className="w-full max-w-sm bg-white rounded-3xl relative p-6 text-center">
    //                 <div className="my-8">
    //                     <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
    //                     <p className="text-gray-600">Загрузка данных заказа...</p>
    //                     {reconnectAttempt > 0 && (
    //                         <p className="text-sm text-gray-500 mt-2">
    //                             Попытка подключения: {reconnectAttempt} из {maxReconnectAttempts}
    //                         </p>
    //                     )}
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    // if (error) {
    //     return (
    //         <div className="flex justify-center items-center bg-slate-900 w-full min-h-screen">
    //             <div className="w-full max-w-sm bg-white rounded-3xl relative p-6 text-center">
    //                 <div className="my-8">
    //                     <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
    //                         <span className="text-red-500 text-2xl">!</span>
    //                     </div>
    //                     <h3 className="text-xl font-bold mb-2">Ошибка</h3>
    //                     <p className="text-gray-600 mb-4">{error}</p>
    //                     <button
    //                         onClick={() => window.location.reload()}
    //                         className="px-4 py-2 bg-blue-500 text-white rounded-full"
    //                     >
    //                         Повторить
    //                     </button>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    const toastId = "reconnect-toast"; 

    useEffect(() => {
        if (!connected && !toast.isActive(toastId)) {
            toast.warn("Переподключение...", {
                toastId,
                position: "top-center",
                autoClose: false,
                hideProgressBar: true,
                closeOnClick: false,
                draggable: false,
                className: "bg-red-100 text-red-600 text-xs text-center rounded-full px-4 py-1",
            });
        } else if (connected) {
            toast.dismiss(toastId); 
        }
    }, [connected]);

    return (
        <div className="flex justify-center items-center bg-slate-900 w-full min-h-screen">
            <div className="w-full max-w-sm bg-[#E8E8E8] rounded-3xl relative p-4 pb-6">
                {/* Header with logo */}
                <div className="flex justify-center my-4">
                    <div className="flex items-center">
                        <div>
                            <img src='/images/logo.svg' alt='logo' />
                        </div>
                    </div>
                </div>

                {/* Queue information */}
                <div className={`bg-gray-100 rounded-full px-6 py-2 mx-auto w-fit my-4 ${styles.queue}`}>
                    <span className={styles.text}>Ваше авто на очереди: <span className={styles.number}>{orderData.queue_position}</span></span>
                </div>

                {/* Connection status indicator */}
                {/* {!connected && (
                    <div className="bg-red-100 text-red-600 text-xs text-center rounded-full px-4 py-1 mx-auto w-fit -mt-2 mb-2">
                        Переподключение...
                    </div>
                )} */}
                <ToastContainer />

                {/* Progress circle */}
                <div className="relative flex justify-center my-8">
                    <div className="absolute w-80 h-80 z-10">
                        <CircularProgressbar
                            value={progress}
                            strokeWidth={10}
                            className='mt-[-20px]'
                            styles={{
                                path: {
                                    stroke: '#B2D0EB',
                                    strokeLinecap: 'round',
                                    transform: 'rotate(-180deg)',
                                    transformOrigin: 'center center',
                                    background: 'linear-gradient(180deg, #B1CFEC 0%, #CADFE8 52.69%, #E3E2E4 90.33%)',
                                    boxShadow: '0px 4px 22.8px 0px #0B52C71A inset',
                                },
                                trail: {
                                    stroke: 'transparent', 
                                },
                                text: {
                                    fill: '#4db8ff',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                },
                            }}
                        />
                    </div>

                    <div className="w-48 h-48 rounded-full flex items-center justify-center">
                        <div className="w-40 h-40 rounded-full flex items-center justify-center">
                            <div className="w-36 h-36 rounded-full bg-white flex flex-col items-center justify-center">
                                <img src='/images/clock.svg' alt='clock' style={{ zIndex: "20", marginBottom: '10px' }} />
                                <img className={styles.background_clock} src='/images/clock_mask.png' alt='background' />

                                <span className="text-5xl font-bold text-white-700" style={{ zIndex: "20" }}>{progress}%</span>

                                <span className="text-sm text-white-500" style={{ zIndex: "20" }}>Осталось: {remainingTime} мин</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Car image */}
                <div className="relative flex justify-center -mt-4 mb-2 h-57 z-40">
                    <img
                        src="/images/car.png"
                        alt="Car"
                        className={styles.car}
                    />
                </div>

                {/* Car info and call section */}
                <div className='bg-gray-50 rounded-4xl p-7 mt-4'>
                    <div className="flex justify-between">
                        <div className='flex flex-col'>
                            <p className="text-gray-400 text-sm" style={{ color: "#00000040" }}>Данные заказа</p>
                            <h3 className="font-semibold text-xl mt-1" style={{ color: "#1E1E1E" }}>{getPackageName()}</h3>
                            {/* <p className="text-gray-600">ID: {orderData.id}</p> */}
                        </div>
                        <div className='right_content'>
                            <a href={`tel:${orderData.client_phone}`} className="bg-black text-white rounded-full px-4 py-2 font-medium">
                                Позвонить
                            </a>
                            {/* Time display */}
                            <div className="flex justify-center mt-2">
                                <span className="text-blue-500 text-3xl font-bold">{formatTime(remainingTime)}</span>
                            </div>
                        </div>
                    </div>
                    {/* Bottom navigation */}
                    <div className={`flex justify-between mt-4 ${styles.bottom_nav}`}>
                        <div className="w-1/3 flex justify-center">
                            <div className="bg-blue-500 rounded-full p-2 w-24 h-12 flex items-center justify-center">
                                <img src='/images/bottom_navigation_icons/clock.svg' alt='clock' />
                            </div>
                        </div>
                        <div className="w-1/3 flex justify-center">
                            <div className="bg-gray-100 rounded-full p-2 w-12 h-12 flex items-center justify-center">
                                <div className="flex">
                                    <img src='/images/bottom_navigation_icons/buble.svg' alt='buble' />
                                </div>
                            </div>
                        </div>
                        <div className="w-1/3 flex justify-center">
                            <div className="bg-gray-100 rounded-full p-2 w-12 h-12 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center">
                                    <img src='/images/bottom_navigation_icons/verified.svg' alt='verified' />
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Client info */}
                    {/* <div className="flex justify-between items-center mt-2 px-2">
                        <div className="text-sm text-gray-600">
                            <span>Клиент: {orderData.client_name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                            <span>Цена: {orderData.total_price} с.</span>
                        </div>
                    </div> */}
                </div>

                {/* Status indicator */}
                {/* <div className={`text-center mt-3 text-xs font-medium px-3 py-1 rounded-full mx-auto w-fit ${getStatusClasses(orderData.status)}`}>
                    {getStatusText(orderData.status)}
                </div> */}
            </div>
        </div>
    );
};

export default HomeScreen;