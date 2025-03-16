'use client'

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// Добавлен необязательный prop websocketId
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

    useEffect(() => {
        // Определяем ID заказа
        let websocketId = propWebsocketId; // Сначала используем prop, если передан

        if (!websocketId) {
            // Проверяем hash в URL
            if (window.location.hash && window.location.hash.length > 1) {
                websocketId = window.location.hash.substring(1);
                console.log("ID получен из hash:", websocketId);
            }

            // Проверяем query параметры
            if (!websocketId) {
                const urlParams = new URLSearchParams(window.location.search);
                websocketId = urlParams.get('id');
                console.log("ID получен из query params:", websocketId);
            }

            // Проверяем, не находимся ли мы на пути /track/ID
            if (!websocketId && window.location.pathname.startsWith('/track/')) {
                const pathParts = window.location.pathname.split('/');
                if (pathParts.length >= 3) {
                    websocketId = pathParts[2];
                    console.log("ID получен из path:", websocketId);
                }
            }
        } else {
            console.log("ID получен из props:", websocketId);
        }

        if (!websocketId) {
            console.error('ID заказа не найден');
            setError('Не удалось найти ID заказа. Пожалуйста, отсканируйте QR-код снова.');
            setLoading(false);
            return;
        }

        console.log('WebSocket ID найден:', websocketId);

        // Создаем WebSocket соединение
        let wsProtocol = 'ws://';

        // Если мы находимся на HTTPS сайте, пытаемся использовать WSS
        if (window.location.protocol === 'https:') {
            console.log('Сайт использует HTTPS, но сервер поддерживает только WS');
            // wsProtocol = 'wss://'; // Раскомментируйте когда настроите SSL на сервере
        }

        const wsUrl = `${wsProtocol}84.54.12.243/ws/order/${websocketId}/`;
        console.log('Подключение к WebSocket:', wsUrl);

        let socket;
        try {
            socket = new WebSocket(wsUrl);
        } catch (err) {
            console.error('Ошибка создания WebSocket:', err);
            setError('Не удалось подключиться к серверу. Пожалуйста, проверьте соединение и попробуйте снова.');
            setLoading(false);
            return;
        }

        // Устанавливаем таймаут на подключение
        const connectionTimeout = setTimeout(() => {
            if (!connected) {
                console.error('Превышено время ожидания WebSocket подключения');
                setError('Превышено время ожидания подключения. Пожалуйста, попробуйте позже.');
                setLoading(false);
                socket.close();
            }
        }, 10000); // 10 секунд таймаут

        // Успешное подключение
        socket.onopen = () => {
            console.log('WebSocket соединение установлено');
            clearTimeout(connectionTimeout);
            setConnected(true);
            setLoading(false);
        };

        // Получение сообщений
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Получены данные:', data);
                setOrderData(data);

                // Расчет прогресса на основе статуса
                if (data.status === "in_progress") {
                    const createdTime = new Date(data.created_at);
                    const now = new Date();
                    const elapsedMinutes = Math.floor((now - createdTime) / (1000 * 60));

                    // Предполагаем, что полный сервис занимает 60 минут
                    const totalServiceTime = 60;
                    const newProgress = Math.min(Math.floor((elapsedMinutes / totalServiceTime) * 100), 99);
                    setProgress(newProgress);

                    // Оставшееся время
                    const remainingMins = Math.max(totalServiceTime - elapsedMinutes, 0);
                    setRemainingTime(remainingMins);
                } else if (data.status === "completed") {
                    setProgress(100);
                    setRemainingTime(0);
                } else if (data.status === "pending") {
                    // Для ожидающих заказов показываем начальный прогресс
                    setProgress(5);
                    setRemainingTime(60);
                }
            } catch (error) {
                console.error('Ошибка обработки данных:', error);
            }
        };

        // Обработка ошибок
        socket.onerror = (error) => {
            console.error('Ошибка WebSocket:', error);
            setConnected(false);
            setError('Произошла ошибка при подключении к серверу. Пожалуйста, попробуйте позже.');
            setLoading(false);
        };

        // Обработка закрытия соединения
        socket.onclose = () => {
            console.log('WebSocket соединение закрыто');
            setConnected(false);
            if (loading) {
                setError('Соединение закрыто. Не удалось получить данные заказа.');
                setLoading(false);
            }
        };

        // Очистка при размонтировании компонента
        return () => {
            clearTimeout(connectionTimeout);
            socket.close();
        };
    }, [propWebsocketId]);

    // Далее весь код остается неизменным

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
    if (loading) {
        return (
            <div className="flex justify-center items-center bg-slate-900 w-full min-h-screen">
                <div className="w-full max-w-sm bg-white rounded-3xl relative p-6 text-center">
                    <div className="my-8">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Загрузка данных заказа...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center bg-slate-900 w-full min-h-screen">
                <div className="w-full max-w-sm bg-white rounded-3xl relative p-6 text-center">
                    <div className="my-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span className="text-red-500 text-2xl">!</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Ошибка</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-full"
                        >
                            Повторить
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center bg-slate-900 w-full min-h-screen">
            <div className="w-full max-w-sm bg-white rounded-3xl relative p-4 pb-6">
                {/* Header with logo */}
                <div className="flex justify-center my-4">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center mr-2">
                            <div className="w-5 h-5 bg-white rounded-sm"></div>
                        </div>
                        <div>
                            <span className="text-blue-500 font-bold text-xl">UNAA</span>
                            <span className="text-gray-400 text-sm block -mt-1">DETAILING</span>
                        </div>
                    </div>
                </div>

                {/* Остальной UI остается неизменным */}
                {/* ... */}

                {/* Queue information */}
                <div className="bg-gray-100 rounded-full px-6 py-2 mx-auto w-fit my-4">
                    <span className="text-gray-600">Ваше авто на очереди: <span className="font-bold">{orderData.queue_position}</span></span>
                </div>

                {/* Connection status indicator */}
                {!connected && (
                    <div className="bg-red-100 text-red-600 text-xs text-center rounded-full px-4 py-1 mx-auto w-fit -mt-2 mb-2">
                        Переподключение...
                    </div>
                )}

                {/* Progress circle */}
                <div className="relative flex justify-center my-4">
                    <div className="w-48 h-48 rounded-full bg-blue-100 flex items-center justify-center">
                        <div className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                            <div className="w-36 h-36 rounded-full bg-white flex flex-col items-center justify-center">
                                {/* Timer icon */}
                                <div className="bg-blue-100 rounded-full p-2 mb-1">
                                    <Clock className="text-blue-500 w-4 h-4" />
                                </div>

                                {/* Percentage */}
                                <span className="text-5xl font-bold text-gray-700">{progress}%</span>

                                {/* Remaining time */}
                                <span className="text-sm text-gray-500">Осталось: {remainingTime} мин</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Car image */}
                <div className="flex justify-center -mt-4 mb-2">
                    <img
                        src="/api/placeholder/400/200"
                        alt="Car"
                        className="w-64"
                    />
                </div>

                {/* Car info and call section */}
                <div className="bg-gray-50 rounded-2xl p-4 mt-4 flex justify-between items-center">
                    <div>
                        <p className="text-gray-400 text-sm">Данные заказа</p>
                        <h3 className="font-bold text-xl">{getPackageName()}</h3>
                        <p className="text-gray-600">ID: {orderData.id}</p>
                    </div>
                    <a href={`tel:${orderData.client_phone}`} className="bg-black text-white rounded-full px-4 py-2 font-medium">
                        Позвонить
                    </a>
                </div>

                {/* Time display */}
                <div className="flex justify-center mt-2">
                    <span className="text-blue-500 text-3xl font-bold">{formatTime(remainingTime)}</span>
                </div>

                {/* Client info */}
                <div className="flex justify-between items-center mt-2 px-2">
                    <div className="text-sm text-gray-600">
                        <span>Клиент: {orderData.client_name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                        <span>Цена: {orderData.total_price} с.</span>
                    </div>
                </div>

                {/* Bottom navigation */}
                <div className="flex justify-between mt-4">
                    <div className="w-1/3 flex justify-center">
                        <div className="bg-blue-500 rounded-full p-2 w-12 h-12 flex items-center justify-center">
                            <Clock className="text-white w-6 h-6" />
                        </div>
                    </div>
                    <div className="w-1/3 flex justify-center">
                        <div className="bg-gray-100 rounded-full p-2 w-12 h-12 flex items-center justify-center">
                            <div className="flex">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mx-px"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full mx-px"></div>
                            </div>
                        </div>
                    </div>
                    <div className="w-1/3 flex justify-center">
                        <div className="bg-gray-100 rounded-full p-2 w-12 h-12 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-blue-500 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status indicator */}
                <div className={`text-center mt-3 text-xs font-medium px-3 py-1 rounded-full mx-auto w-fit ${getStatusClasses(orderData.status)}`}>
                    {getStatusText(orderData.status)}
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;